
require("dotenv").config();

const readline = require("readline/promises");
const { stdin, stdout } = require("process");

const { ChatGroq } = require("@langchain/groq");
const { tool } = require("@langchain/core/tools");

const {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
} = require("@langchain/core/messages");

const { z } = require("zod");

// Import the existing database tools.
const searchBooks = require("./tools/searchBooks");
const checkAvailability = require("./tools/checkAvailability");
const issueBook = require("./tools/issueBook");
const returnBook = require("./tools/returnBook");
const getMemberLoans = require("./tools/getMemberLoans");
const listOverdueBooks = require("./tools/listOverdueBooks");

// Check that the API key is available.
if (!process.env.GROQ_API_KEY) {
  console.error(
    "GROQ_API_KEY is missing. Please check your .env file."
  );
  process.exit(1);
}

// Initialize the language model.
const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
});

// Define the six library tools.
const tools = [
  tool(
    async ({ keyword }) => searchBooks(keyword),
    {
      name: "search_books",
      description:
        "Search library books by title, author, or genre.",
      schema: z.object({
        keyword: z.string().min(1),
      }),
    }
  ),

  tool(
    async ({ bookTitle }) => checkAvailability(bookTitle),
    {
      name: "check_availability",
      description:
        "Check the availability of a book by title.",
      schema: z.object({
        bookTitle: z.string().min(1),
      }),
    }
  ),

  tool(
  async ({ memberId, bookTitle }) => {
    pendingAction = {
      name: "issue_book",
      args: {
        memberId: memberId.trim().toUpperCase(),
        bookTitle: bookTitle.trim(),
      },
    };

    return {
      success: true,
      requires_confirmation: true,
      message: `Please confirm issuing "${bookTitle}" to member ${memberId}.`,
    };
  },
  {
    name: "issue_book",
    description:
      "Prepare a book issue request. Call this tool when a user asks to issue or borrow a book. It saves the pending request and asks for confirmation; it does not issue the book yet.",
    schema: z.object({
      memberId: z.string().min(1),
      bookTitle: z.string().min(1),
    }),
  }
),

tool(
  async ({ memberId, bookTitle }) => {
    pendingAction = {
      name: "return_book",
      args: {
        memberId: memberId.trim().toUpperCase(),
        bookTitle: bookTitle.trim(),
      },
    };

    return {
      success: true,
      requires_confirmation: true,
      message: `Please confirm returning "${bookTitle}" for member ${memberId}.`,
    };
  },
  {
    name: "return_book",
    description:
      "Prepare a book return request. Call this tool when a user asks to return a book. It saves the pending request and asks for confirmation; it does not return the book yet.",
    schema: z.object({
      memberId: z.string().min(1),
      bookTitle: z.string().min(1),
    }),
  }
),
  tool(
    async ({ memberId }) => getMemberLoans(memberId),
    {
      name: "get_member_loans",
      description:
        "Retrieve a member's loan records, overdue status, and unpaid fines.",
      schema: z.object({
        memberId: z.string().min(1),
      }),
    }
  ),

  tool(
    async () => listOverdueBooks(),
    {
      name: "list_overdue_books",
      description:
        "List currently overdue books and their estimated fines.",
      schema: z.object({}),
    }
  ),
];

// Make tools accessible by name.
const toolsByName = Object.fromEntries(
  tools.map((libraryTool) => [
    libraryTool.name,
    libraryTool,
  ])
);

// Allow the model to request the defined tools.
const modelWithTools = model.bindTools(tools);

// Store conversation history.
const messages = [
  new SystemMessage({
    content: `
You are LibroBot, a helpful college library assistant.

Follow these rules:
1. Use the available database tools to retrieve library information.
2. Never invent book records, members, availability, or loan details.
3. Ask for missing book titles or member IDs when necessary.
4. Never issue or return a book without explicit user confirmation.
5. The application, not the language model, handles confirmation.
6. An issue or return request is only prepared initially.
7. Never claim an operation succeeded unless its database function reports success.
8. Explain borrowing restrictions clearly.
9. The loan period is 14 days.
10. The late fine is ₹5 per day.
11. Be polite and explain results in simple language.
12. When a database tool returns a total or aggregate value,
    report that exact value. Never recalculate totals yourself
    when the tool already provides them.
13. For requests to search for books, call search_books.
14. For availability questions, call check_availability.
15. For requests to issue a book, call issue_book with the member ID and book title. Do not merely say that you will prepare the request.
16. For requests to return a book, call return_book with the member ID and book title.
17. For overdue-book questions, call list_overdue_books.
18. For a member's loan history, call get_member_loans.
19. Never claim an operation is prepared or confirmed unless the application has actually saved the pending action.
20. Never bypass database business rules or claim an issue or return succeeded without a successful tool result.
`,
  }),
];

// This variable stores the action awaiting confirmation.
let pendingAction = null;

// Recognize explicit confirmation and cancellation messages.
function isYes(text) {
  return /^(yes|y|confirm|confirmed|i confirm|go ahead|proceed|sure|yes please)[.! ]*$/i.test(
    text.trim()
  );
}

function isNo(text) {
  return /^(no|n|cancel|cancel it|no thanks)[.! ]*$/i.test(
    text.trim()
  );
}

// Execute read-only tools, or save an issue/return request
// and wait for confirmation.
async function executeToolCall(call) {
  const args = call.args || {};

  if (
    call.name === "issue_book" ||
    call.name === "return_book"
  ) {
    const memberId =
      typeof args.memberId === "string"
        ? args.memberId.trim()
        : "";

    const bookTitle =
      typeof args.bookTitle === "string"
        ? args.bookTitle.trim()
        : "";

    if (!memberId || !bookTitle) {
      return {
        success: false,
        message:
          "A member ID and book title are required.",
      };
    }

    // Save the action BEFORE asking for confirmation.
    pendingAction = {
      name: call.name,
      args: {
        memberId,
        bookTitle,
      },
    };

    console.log(
      "Confirmation action saved:",
      pendingAction.name,
      pendingAction.args
    );

    return {
      success: false,
      requires_confirmation: true,
      message:
        call.name === "issue_book"
          ? `Please confirm that you want to issue "${bookTitle}" to member ${memberId}. Type yes to confirm or no to cancel.`
          : `Please confirm that you want to return "${bookTitle}" for member ${memberId}. Type yes to confirm or no to cancel.`,
    };
  }

  const selectedTool = toolsByName[call.name];

  if (!selectedTool) {
    return {
      success: false,
      error: `Unknown tool: ${call.name}`,
    };
  }

  return await selectedTool.invoke(args);
}

// Send a user message to the model and process its tool calls.
async function askLibroBot(userText) {
  messages.push(new HumanMessage(userText));

  for (let step = 0; step < 6; step++) {
    const response = await modelWithTools.invoke(messages);

    console.log(
  "DEBUG: Model requested tools:",
  (response.tool_calls || []).map((call) => ({
    name: call.name,
    args: call.args,
  }))
);

    messages.push(response);

    // The model has responded without requesting another tool.
  
if (
  !response.tool_calls ||
  response.tool_calls.length === 0
) {
  // Fallback for explicit issue requests.
  const issueMatch = userText.match(
    /^issue\s+["']?(.+?)["']?\s+to\s+member\s+(M\d+)[.! ]*$/i
  );

  if (issueMatch) {
    return await executeToolCall({
      name: "issue_book",
      args: {
        bookTitle: issueMatch[1].trim(),
        memberId: issueMatch[2].trim().toUpperCase(),
      },
    });
  }

  // Fallback for explicit return requests.
  const returnMatch = userText.match(
    /^member\s+(M\d+)\s+is\s+returning\s+["']?(.+?)["']?(?:\s+today)?[.! ]*$/i
  );

  if (returnMatch) {
    return await executeToolCall({
      name: "return_book",
      args: {
        memberId: returnMatch[1].trim().toUpperCase(),
        bookTitle: returnMatch[2].trim(),
      },
    });
  }

  return response.content;
}


    for (const call of response.tool_calls) {
      let result;

      try {
        result = await executeToolCall(call);
      } catch (error) {
        result = {
          success: false,
          error: "The tool operation failed.",
          details: error.message,
        };
      }

      // Return a JSON-safe result to the model's tool-call history.
      const safeResult =
        result === undefined
          ? {
              success: false,
              error: "The tool returned no result.",
            }
          : result;

      messages.push(
        new ToolMessage({
          content: JSON.stringify(safeResult),
          tool_call_id: call.id,
        })
      );

      // Do not let the model execute or retry a mutation.
      // main() must receive the confirmation request.
      if (
        call.name === "issue_book" ||
        call.name === "return_book"
      ) {
        messages.push(
          new AIMessage({
            content:
              safeResult.message ||
              "The operation is waiting for user confirmation.",
          })
        );

        return safeResult;
      }
    }
  }

  return "I could not complete that request. Please try again.";
}

// Format the returned result for the terminal.
function displayResult(result) {
  if (
    result &&
    result.requires_confirmation === true
  ) {
    console.log("\nLibroBot:", result.message, "\n");
    return;
  }

  if (typeof result === "string") {
    console.log("\nLibroBot:", result, "\n");
    return;
  }

  console.log(
    "\nLibroBot:",
    JSON.stringify(result, null, 2),
    "\n"
  );
}

// Main interactive terminal application.
async function main() {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  console.log("\nLibroBot - Smart College Library Assistant");
  console.log("Ask me about books, availability, or loans.");
  console.log("Type 'exit' to quit.\n");

  try {
    while (true) {
      const userText = (
        await rl.question("You: ")
      ).trim();

      if (!userText) {
        continue;
      }

      if (userText.toLowerCase() === "exit") {
        console.log("LibroBot: Goodbye!");
        break;
      }

      // Handle a previously prepared issue/return operation.
      if (pendingAction !== null) {
        if (isYes(userText)) {
          // Copy and clear the pending operation before execution.
          const action = pendingAction;
          pendingAction = null;

          let result;

          try {
            if (action.name === "issue_book") {
              result = issueBook(
                action.args.memberId,
                action.args.bookTitle,
                true
              );
            } else if (action.name === "return_book") {
              result = returnBook(
                action.args.memberId,
                action.args.bookTitle,
                true
              );
            } else {
              result = {
                success: false,
                error: "Unknown pending operation.",
              };
            }
          } catch (error) {
            result = {
              success: false,
              error: "The confirmed operation failed.",
              details: error.message,
            };
          }

          // Record the confirmation and its actual result.
          messages.push(new HumanMessage(userText));
          messages.push(
            new AIMessage({
              content:
                "Confirmed operation result: " +
                JSON.stringify(result),
            })
          );

          displayResult(result);
          continue;
        }

        if (isNo(userText)) {
          pendingAction = null;

          messages.push(new HumanMessage(userText));
          messages.push(
            new AIMessage({
              content: "The pending operation was cancelled.",
            })
          );

          console.log(
            "\nLibroBot: Okay, I cancelled that operation.\n"
          );

          continue;
        }

        console.log(
          "\nLibroBot: Please reply 'yes' to confirm or 'no' to cancel.\n"
        );

        continue;
      }
      


      // Do not let an unrelated "yes" trigger an operation.
      if (isYes(userText) || isNo(userText)) {
        console.log(
          "\nLibroBot: There is no pending operation to confirm or cancel. Please tell me what you would like to do.\n"
        );
        continue;
      }

      try {
        const answer = await askLibroBot(userText);
        displayResult(answer);
      } catch (error) {
        console.error(
          "\nAn error occurred:",
          error.message
        );

        console.log(
          "Please check your API key, package installation, and internet connection.\n"
        );
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("LibroBot could not start:", error.message);
  process.exitCode = 1;
});


