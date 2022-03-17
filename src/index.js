const { response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

// Middleware to verify if the customer exists
function VerifyCustomersExistance(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer)
    return response.status(400).json({error: "Customer not found!"});

  request.customer = customer;

  return next();
}

function GetBalance(statement){
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit')
      return acc + operation.amount;
    else
      return acc - operation.amount;
  }, 0);

  return balance;
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  )

  if (customerAlreadyExists)
    return response.status(401).json({error: "Customer already exists."})

  customers.push({
    cpf: cpf,
    name: name,
    id: uuidv4(),
    statements: [],
  });

  return response.status(201).send();
});

app.get('/statement/', VerifyCustomersExistance, (request, response) => {
  const { customer } = request;

  return response.json(customer.statements);
})

app.post('/deposit', VerifyCustomersExistance, (request, response) => {
  const { customer } = request;
  const { description, amount } = request.body;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: 'credit'
  };

  customer.statements.push(statementOperation);

  return response.status(201).send();
})

app.post('/withdraw', VerifyCustomersExistance, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  if (customer.statements.length === 0)
    return response.status(400).json({error: "Insufficient funds.1"});

  const balance = GetBalance(customer.statements);
  if (balance < amount)
    return response.status(400).json({error: "Insufficient funds.2"});

  const statementOperation = {
    description: 'Withdraw',
    amount,
    createdAt: new Date(),
    type: 'debit'
  };

  customer.statements.push(statementOperation);

  return response.status(201).send();
})

app.get('/statement/date', VerifyCustomersExistance, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormated = new Date(date);

  const filteredStatements = customer.statements.filter((statement) => {
    return statement.createdAt.toDateString() === dateFormated.toDateString();
  });

  return response.json(filteredStatements);
})

app.put('/account', VerifyCustomersExistance, (request, response) => {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(200).send()
})

app.get("/account", VerifyCustomersExistance, (request, response) => {
  const { customer } = request;

  return response.json(customer);
})

app.listen(3333);
