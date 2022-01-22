const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const dateFormat = require("date-fns/format");

const isValid = require("date-fns/isValid");

const parse = require("date-fns/parse");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,

      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);

    process.exit(1);
  }
};

initializeDatabaseAndServer();

function convertDbObjectToResponseObject(dbObject) {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
}

function hasStatus(query) {
  return query.status !== undefined;
}

function hasPriority(query) {
  return query.priority !== undefined;
}

function hasCategory(query) {
  return query.category !== undefined;
}

function hasTodo(query) {
  return query.todo !== undefined;
}

function hasStatusAndPriority(query) {
  return query.status !== undefined && query.priority !== undefined;
}

function hasCategoryAndStatus(query) {
  return query.category !== undefined && query.status !== undefined;
}

function hasPriorityAndCategory(query) {
  return query.priority !== undefined && query.category !== undefined;
}

function hasDate(query) {
  return query.date !== undefined;
}

function isStatusValid(status) {
  return status === "TO DO" || status === "IN PROGRESS" || status === "DONE";
}

function isPriorityValid(priority) {
  return priority === "LOW" || priority === "MEDIUM" || priority === "HIGH";
}

function isCategoryValid(category) {
  return category === "WORK" || category === "HOME" || category === "LEARNING";
}

function isDateValid(date) {
  const validity = parse(date, "yyyy-MM-dd", new Date());

  return isValid(validity);
}

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category, date } = request.query;

  let result = null;

  let getQuery = "";

  switch (true) {
    case hasStatusAndPriority(request.query):
      switch (false) {
        case isStatusValid(status):
          response.status(400);

          response.send("Invalid Todo Status");

          break;

        case isPriorityValid(priority):
          response.status(400);

          response.send("Invalid Todo Priority");

          break;

        default:
          getQuery = `SELECT *

                            FROM todo

                            WHERE status = '${status}' AND

                            priority = '${priority}';`;

          result = await database.all(getQuery);

          response.send(
            result.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
          );
      }

      break;

    case hasCategoryAndStatus(request.query):
      switch (false) {
        case isCategoryValid(category):
          response.status(400);

          response.send("Invalid Todo Category");

          break;

        case isStatusValid(status):
          response.status(400);

          response.send("Invalid Todo Status");

          break;

        default:
          getQuery = `SELECT * 

                            FROM todo 

                            WHERE category = '${category}' AND

                            status = '${status}';`;

          result = await database.all(getQuery);

          response.send(
            result.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
          );
      }

      break;

    case hasPriorityAndCategory(request.query):
      switch (false) {
        case isPriorityValid(priority):
          response.status(400);

          response.send("Invalid Todo Priority");

          break;

        case isCategoryValid(category):
          response.status(400);

          response.send("Invalid Todo Category");

          break;

        default:
          getQuery = `SELECT * 

                            FROM todo 

                            WHERE category = '${category}' AND

                            priority = '${priority}';`;

          result = await database.all(getQuery);

          response.send(
            result.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
          );
      }

      break;

    case hasPriority(request.query):
      if (isPriorityValid(priority)) {
        getQuery = `

        SELECT *

        FROM todo

        WHERE priority = '${priority}';`;

        result = await database.all(getQuery);

        response.send(
          result.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);

        response.send("Invalid Todo Priority");
      }

      break;

    case hasStatus(request.query):
      if (isStatusValid(status)) {
        getQuery = `

        SELECT *

        FROM todo

        WHERE status = '${status}';`;

        result = await database.all(getQuery);

        response.send(
          result.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);

        response.send("Invalid Todo Status");
      }

      break;

    case hasCategory(request.query):
      if (isCategoryValid(category)) {
        getQuery = `

        SELECT *

        FROM todo

        WHERE category = '${category}';`;

        result = await database.all(getQuery);

        response.send(
          result.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);

        response.send("Invalid Todo Category");
      }

      break;

    default:
      getQuery = `SELECT * 

                    FROM todo 

                    WHERE todo LIKE '%${search_q}%';`;

      result = await database.all(getQuery);

      response.send(
        result.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoIdQuery = `SELECT * FROM todo WHERE id = ${todoId};`;

  const todoIdObject = await database.get(getTodoIdQuery);

  response.send(convertDbObjectToResponseObject(todoIdObject));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  let getDateQuery = "";

  if (isDateValid(date)) {
    const formattedDate = dateFormat(new Date(date), "yyyy-MM-dd");

    const getDateQuery = `

    SELECT *

    FROM todo

    WHERE due_date = '${formattedDate}';`;

    const dateResult = await database.all(getDateQuery);

    response.send(
      dateResult.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  } else {
    response.status(400);

    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const postContent = request.body;

  const { id, todo, priority, status, category, dueDate } = postContent;

  switch (false) {
    case isStatusValid(status):
      response.status(400);

      response.send("Invalid Todo Status");

      break;

    case isPriorityValid(priority):
      response.status(400);

      response.send("Invalid Todo Priority");

      break;

    case isCategoryValid(category):
      response.status(400);

      response.send("Invalid Todo Category");

      break;

    case isDateValid(dueDate):
      response.status(400);

      response.send("Invalid Due Date");

      break;

    default:
      const postTodosQuery = `

      INSERT INTO todo(id, todo, priority, status, category, due_date)

      VALUES (${id}, 

        '${todo}', 

        '${priority}', 

        '${status}', 

        '${category}', 

        '${dateFormat(new Date(dueDate), "yyyy-MM-dd")}');`;

      await database.run(postTodosQuery);

      response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const requestBody = request.body;

  let updateQuery = "";

  const getTodoToBeUpdated = `SELECT *

                                FROM todo

                                WHERE id LIKE ${todoId};`;

  const todoToBeUpdated = await database.get(getTodoToBeUpdated);

  switch (true) {
    case hasStatus(requestBody):
      if (isStatusValid(requestBody.status)) {
        updateQuery = `

              UPDATE todo

              SET status = '${requestBody.status}'

              WHERE id LIKE ${todoId}

              ;`;

        await database.run(updateQuery);

        response.send("Status Updated");
      } else {
        response.status(400);

        response.send("Invalid Todo Status");
      }

      break;

    case hasPriority(requestBody):
      if (isPriorityValid(requestBody.priority)) {
        updateQuery = `

            UPDATE todo

            SET priority = '${requestBody.priority}'

            WHERE id LIKE ${todoId};`;

        await database.run(updateQuery);

        response.send("Priority Updated");
      } else {
        response.status(400);

        response.send("Invalid Todo Priority");
      }

      break;

    case hasCategory(requestBody):
      if (isCategoryValid(requestBody.category)) {
        updateQuery = `

            UPDATE todo

            SET category = '${requestBody.category}'

            WHERE id LIKE ${todoId};`;

        await database.run(updateQuery);

        response.send("Category Updated");
      } else {
        response.status(400);

        response.send("Invalid Todo Category");
      }

      break;

    case requestBody.dueDate !== undefined:
      if (isDateValid(requestBody.dueDate)) {
        updateQuery = `

            UPDATE todo

            SET due_date = '${dateFormat(
              new Date(requestBody.dueDate),

              "yyyy-MM-dd"
            )}'

            WHERE id LIKE ${todoId};`;

        await database.run(updateQuery);

        response.send("Due Date Updated");
      } else {
        response.status(400);

        response.send("Invalid Due Date");
      }

      break;

    default:
      if (requestBody.todo !== undefined) {
        updateQuery = `

            UPDATE todo

            SET todo = '${requestBody.todo}';`;

        await database.run(updateQuery);

        response.send("Todo Updated");
      }
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `

    DELETE FROM todo 

    WHERE 

    id LIKE ${todoId};`;

  await database.run(deleteTodoQuery);

  response.send("Todo Deleted");
});

module.exports = app;
