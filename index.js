// imports here for express and pg
const express = require("express");
const app = express();
const pg = require("pg");
app.use(require("morgan")("dev"));
app.use(express.json());

// URL need the password (:postgres) in this case.
const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost/acme_hr_directory"
);

const PORT = process.env.PORT || 3000;

// Routes

// GET Employees
app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
           SELECT * from employees;
           `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
              SELECT * FROM employees WHERE id= $1;
              `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

// GET Departments
app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `
           SELECT * from departments;
           `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/departments/:id", async (req, res, next) => {
  try {
    const SQL = `
            SELECT * FROM departments WHERE id= $1;
            `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

// POST & DELETE
app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
            INSERT INTO employees(name, department_id)
            VALUES ($1, $2)
            RETURNING *
            `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
            DELETE from employees WHERE id=$1;
            `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
            UPDATE employees
            SET name=$1, department_id=$2, updated_at=now()
            WHERE id =$3
            `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

// Initialize the Table
const init = async () => {
  await client.connect();
  let SQL = `
      DROP TABLE IF EXISTS employees;
      DROP TABLE IF EXISTS departments;
      CREATE TABLE departments(
          id SERIAL PRIMARY KEY,
          department_name VARCHAR(255) NOT NULL
      );
      CREATE TABLE employees(
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          department_id INTEGER REFERENCES departments(id) NOT NULL,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
      );
    `;
  await client.query(SQL);
  SQL = `
      INSERT INTO departments(department_name) values('Mergers and Acquisitions');
      INSERT INTO departments(department_name) values('Finance');
      INSERT INTO departments(department_name) values('Operations');
      INSERT INTO employees(name, department_id) values('Patrick Bateman', (SELECT id from departments WHERE department_name='Mergers and Acquisitions'));
      INSERT INTO employees(name, department_id) values('Paul Allen', (SELECT id from departments WHERE department_name='Finance'));
      INSERT INTO employees(name, department_id) values('David Van Patten', (SELECT id from departments WHERE department_name='Operations'));
    `;
  await client.query(SQL);
  console.log("data seeded");
  app.listen(PORT, () => {
    console.log(`I am listening on port number ${PORT}`);
  });
};

init();
