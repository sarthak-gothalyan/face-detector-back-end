const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'sarthak',
    password : 'sarthak gothalyan postgres',
    database : 'face-detection-users'
  }
});

const app = express();

let emptyUser = {name: 'no one', id: '0', entries: 0};

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
	res.json(emptyUser);
});

app.post('/register', (req, res) => {
	const {email, name, password} = req.body;
	const hashed = bcrypt.hashSync(password, 10);
	db.transaction(trx => {
		return trx.insert({
			hash: hashed,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return db('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name,
				})
				.then(user => {
					res.json(user[0]);
				})
		})
	}).then(() => {})
	.catch(err => res.status(400).json('unable to register'))
});

app.post('/signin', (req, res) => {
	db.select('email', 'hash').from('login').where('email', '=', req.body.email)
		.then(users => {
			if(users.length) {
				if(bcrypt.compareSync(req.body.password, users[0].hash) ) {
					db.select('*').from('users').where('email', '=', users[0].email)
						.then(response => {res.json(response[0]) } );
				} else {
					res.json('incorrect password');
				}
			} else {
				res.json('no such user exist');
			}
		})
		.catch(err => {res.status(400).json(err) } );
});

app.get('/profile/:id', (req, res) => {
	let {id } = req.params;
	db.select('*').from('users').where({id: Number(id)})
		.then(response => {
			if(response.length) {
				res.json(response[0]);
			} else {
				res.status(400).json('no user found');
			}
		});
});

app.put('/image', (req, res) => {
	let {id } = req.body;
	if(!id) {
		db('users').where('id', '=', Number(id))
			.increment('entries', 1)
			.returning('entries')
			.then(response => {
				res.json(response[0]);
			})
			.catch(err =>{
				res.json(0);
			})
	} else{
		res.json(0);
	}
});
//sushant for hacktoberfest

app.listen(3000, () => {});
