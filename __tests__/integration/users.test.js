// Tell Node that we're in test "mode"

// IF RUNNING WITH OTHER TEST FILE USE jest --runInBand
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const bcrypt = require('bcrypt');

let testUser;
let testUser2;
let _token;

beforeAll(async () => {
	const hashedPassword = await bcrypt.hash('password', 1);
	const user = await db.query(
		`INSERT INTO users (username, password, first_name, last_name, email)
        VALUES ('testmcgee404', 'password', 'Test', 'McGee', 'testmcgee@example.com')
        RETURNING username, first_name, last_name, email, is_admin, photo_url`
	);

	testUser = user.rows[0];
	testUser.jobs = [];
	testUser.technologies = [];

	const user2 = await db.query(
		`INSERT INTO users 
					(username, password, first_name, last_name, email, is_admin)
					VALUES
					('testUser',$1,'Test','User','testuser@example.com',true)
					RETURNING username, first_name, last_name, email, is_admin, photo_url `,
		[ hashedPassword ]
	);
	testUser2 = user2.rows[0];
	testUser2.jobs = [];
	testUser2.technologies = [];
	const response = await request(app).post('/login').send({
		username : 'testUser',
		password : 'password'
	});

	_token = response.body.token;
});

// beforeEach(async () => {
// 	const user = await db.query(
// 		`INSERT INTO users (username, password, first_name, last_name, email)
//         VALUES ('testmcgee404', 'password', 'Test', 'McGee', 'testmcgee@example.com')
//         RETURNING username, first_name, last_name, email, is_admin, photo_url`
// 	);

// 	testUser = user.rows[0];
// });

// afterEach(async () => {
// 	await db.query(`DELETE FROM users WHERE username = testmcgee404`);
// });

afterAll(async () => {
	await db.query(`DELETE FROM users`);
	await db.end();
});

describe('GET /users', () => {
	test('Get all users', async () => {
		const res = await request(app).get('/users');
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ users: [ testUser, testUser2 ] });
	});
});

describe('GET /users/:username', () => {
	test('Gets a single user', async () => {
		const res = await request(app).get(`/users/${testUser.username}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			user : { ...testUser }
		});
		expect(res.body.user).not.toHaveProperty('password');
	});
	test('Responds with 404 for invalid username', async () => {
		const res = await request(app).get(`/users/testmcgee420`);
		expect(res.statusCode).toBe(404);
	});
});

describe('POST /users', () => {
	test('Registers a user', async () => {
		const newUser = {
			username   : 'McDouble4Lyfe',
			email      : 'iLoveTheMcDouble@example.com',
			first_name : 'Mr.',
			last_name  : 'McDouble',
			password   : 'McChicken'
		};
		const res = await request(app).post('/users').send(newUser);

		expect(res.statusCode).toBe(201);
		expect(res.body).not.toHaveProperty('password');
		expect(res.body).toHaveProperty('token');
	});

	test('Reject POST request because bad jsonschema', async () => {
		const response = await request(app).post('/users').send({
			username   : 'McDouble4Lyfe',
			email      : 'NOT A VALID EMAIL',
			first_name : 'Mr.',
			last_name  : 'McDouble'
		});
		expect(response.statusCode).toBe(400);
	});

	test('Reject POST request because invalid photo_url', async () => {
		const response = await request(app).post('/users').send({
			username   : 'McDouble4Lyfe',
			email      : 'iLoveTheMcDouble@example.com',
			first_name : 'Mr.',
			last_name  : 'McDouble',
			photo_url  : 'NOT A VALID PHOTO_URL'
		});
		expect(response.statusCode).toBe(400);
	});
});

describe('PATCH /users/:username', () => {
	test('Updates a single user', async () => {
		const res = await request(app).patch(`/users/${testUser2.username}`).send({
			first_name : 'Test',
			last_name  : 'User2',
			_token     : _token
		});
		expect(res.statusCode).toBe(200);
		expect(res.body.user).toEqual(
			expect.objectContaining({
				username   : 'testUser',
				first_name : 'Test',
				last_name  : 'User2',
				email      : 'testuser@example.com'
			})
		);
	});
	test('Reject PATCH request because bad jsonschema', async () => {
		const response = await request(app).patch(`/users/${testUser2.username}`).send({
			first_name : 'Test',
			last_name  : 8000,
			_token     : _token
		});
		expect(response.statusCode).toBe(400);
	});

	test('Reject PATCH request because invalid photo_url', async () => {
		const response = await request(app).patch(`/users/${testUser2.username}`).send({
			first_name : 'Test',
			last_name  : 'User',
			photo_url  : 'NOT A VALID PHOTO_URL',
			_token     : _token
		});
		expect(response.statusCode).toBe(400);
	});
});

describe('DELETE /users/:username', () => {
	test('Deletes a single user', async () => {
		const res = await request(app).delete(`/users/${testUser2.username}`).send({ _token });
		expect(res.statusCode).toBe(200);
		// expect(res.body).toEqual({ message: `User with username '${testUser.username}' successfully deleted` });
		expect(res.body).toHaveProperty('message');
	});
});
