// Tell Node that we're in test "mode"

// IF RUNNING WITH OTHER TEST FILE USE jest --runInBand
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const moment = require('moment');
const bcrypt = require('bcrypt');

let testCompany;
let _token;

beforeAll(async () => {
	const company = await db.query(
		`INSERT INTO companies (handle, name, num_employees, description, logo_url) VALUES ('apple','Apple', 5, 'We do not sell apples. I know, confusing.', 'https://9to5mac.com/wp-content/uploads/sites/6/2018/02/logo.jpg?quality=82&strip=all') RETURNING *`
	);
	testCompany = company.rows[0];

	const hashedPassword = await bcrypt.hash('password', 1);
	await db.query(
		`INSERT INTO users 
					(username, password, first_name, last_name, email, is_admin)
					VALUES
					('testUser',$1,'Test','User','testuser@example.com',true) `,
		[ hashedPassword ]
	);

	const response = await request(app).post('/login').send({
		username : 'testUser',
		password : 'password'
	});

	_token = response.body.token;
});

beforeEach(async () => {
	const job = await db.query(
		`INSERT INTO jobs (title, salary, equity, company_handle) VALUES ('Junior Software Engineer', 65000, 0.3, 'apple') RETURNING *`
	);

	testJob = job.rows[0];
	testJob.date_posted = moment(testJob.date_posted).format('MMM Do YY');
});

afterEach(async () => {
	await db.query(`DELETE FROM jobs`);
});

afterAll(async () => {
	await db.query(`DELETE FROM companies`);
	await db.query(`DELETE FROM users`);
	await db.end();
});

describe('GET /jobs', () => {
	test('Get all jobs', async () => {
		const res = await request(app).get('/jobs').send({ _token });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ jobs: [ testJob ] });
	});
});

describe('GET /jobs/:id', () => {
	test('Gets a single job', async () => {
		const res = await request(app).get(`/jobs/${testJob.id}`).send({ _token });
		testJob.company = {
			handle        : 'apple',
			name          : 'Apple',
			num_employees : 5,
			description   : 'We do not sell apples. I know, confusing.',
			logo_url      : 'https://9to5mac.com/wp-content/uploads/sites/6/2018/02/logo.jpg?quality=82&strip=all'
		};
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			job : { ...testJob }
		});
	});
	test('Responds with 404 for invalid id', async () => {
		const res = await request(app).get(`/jobs/10000`);
		expect(res.statusCode).toBe(404);
	});
});

describe('POST /jobs', () => {
	test('Creates a single job', async () => {
		const newJob = {
			title          : 'Accountant',
			salary         : 50000,
			equity         : 0.5,
			company_handle : 'apple',
			_token         : _token
		};
		const res = await request(app).post('/jobs').send(newJob);
		expect(res.statusCode).toBe(201);
		expect(res.body.job).toEqual(
			expect.objectContaining({
				title          : 'Accountant',
				salary         : 50000,
				equity         : 0.5,
				company_handle : 'apple'
			})
		);
	});

	test('Reject POST request because bad jsonschema', async () => {
		const response = await request(app).post('/jobs').send({
			title          : 'Accountant',
			salary         : 'STRING NOT NUMBER',
			equity         : 0.5,
			company_handle : 'apple',
			_token         : _token
		});
		expect(response.statusCode).toBe(400);
	});

	test('Reject POST request because invalid equity not between 0 and 1', async () => {
		const response = await request(app).post('/jobs').send({
			title          : 'Accountant',
			salary         : 50000,
			equity         : 1.1,
			company_handle : 'apple',
			_token         : _token
		});
		expect(response.statusCode).toBe(400);
	});
});

describe('PATCH /jobs/:id', () => {
	test('Updates a single job', async () => {
		const res = await request(app).patch(`/jobs/${testJob.id}`).send({
			title          : 'Accountant',
			salary         : 50000,
			equity         : 0.7,
			company_handle : 'apple',
			_token         : _token
		});
		expect(res.statusCode).toBe(200);
		expect(res.body.job).toEqual(
			expect.objectContaining({
				title          : 'Accountant',
				salary         : 50000,
				equity         : 0.7,
				company_handle : 'apple'
			})
		);
	});
	test('Reject PATCH request because bad jsonschema', async () => {
		const response = await request(app).patch(`/jobs/${testJob.id}`).send({
			title          : 'Accountant',
			salary         : 'STRING NOT A NUMBER',
			equity         : 0.5,
			company_handle : 'apple',
			_token         : _token
		});
		expect(response.statusCode).toBe(400);
	});

	test('Reject PATCH request because invalid equity not between 0 and 1', async () => {
		const response = await request(app).patch(`/jobs/${testCompany.id}`).send({
			title          : 'Accountant',
			salary         : 50000,
			equity         : 1.1,
			company_handle : 'apple',
			_token         : _token
		});
		expect(response.statusCode).toBe(400);
	});
});

describe('DELETE /jobs/:id', () => {
	test('Deletes a single job', async () => {
		const res = await request(app).delete(`/jobs/${testJob.id}`).send({ _token });
		expect(res.statusCode).toBe(200);
		// expect(res.body).toEqual({ message: `Job ${testJob.id} successfully deleted` });
		expect(res.body).toHaveProperty('message');
	});
});

describe('POST /jobs/:id/apply', () => {
	test('Sends application to a job posting', async () => {
		const res = await request(app).post(`/jobs/${testJob.id}/apply`).send({
			state  : 'interested',
			_token : _token
		});
		expect(res.statusCode).toBe(201);
		expect(res.body).toHaveProperty('message');
		expect(res.body).toHaveProperty('application');
		expect(res.body.application).toHaveProperty('state');
		expect(res.body.application).toHaveProperty('username');
		expect(res.body.application).toHaveProperty('job_id');
	});
});
