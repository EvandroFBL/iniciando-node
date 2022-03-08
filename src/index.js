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

app.listen(3333);
