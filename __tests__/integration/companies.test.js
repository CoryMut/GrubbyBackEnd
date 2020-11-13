// IF RUNNING WITH OTHER TEST FILE USE jest --runInBand
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const bcrypt = require('bcrypt');

let testCompany;
let _token;

beforeAll(async () => {
	// const company = await db.query(
	// 	`INSERT INTO companies (handle, name, num_employees, description, logo_url) VALUES ('apple','Apple', 5, 'We do not sell apples. I know, confusing.', 'https://9to5mac.com/wp-content/uploads/sites/6/2018/02/logo.jpg?quality=82&strip=all') RETURNING *`
	// );
	// testCompany = company.rows[0];

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
	const result = await db.query(
		`INSERT INTO companies (handle, name, num_employees, description, logo_url) VALUES ('apple','Apple', 5, 'We do not sell apples. I know, confusing.', 'https://9to5mac.com/wp-content/uploads/sites/6/2018/02/logo.jpg?quality=82&strip=all') RETURNING *`
	);
	testCompany = result.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
	await db.query(`DELETE FROM companies`);
	await db.query(`DELETE FROM users`);
	await db.end();
});

describe('GET /companies', () => {
	test('Get a list with one company', async () => {
		const res = await request(app).get('/companies').send({ _token });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ companies: [ testCompany ] });
	});
});

describe('GET /companies/:handle', () => {
	test('Gets a single company', async () => {
		testCompany.jobs = [];
		const res = await request(app).get(`/companies/${testCompany.handle}`).send({ _token });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			company : { ...testCompany }
		});
	});
	test('Responds with 404 for invalid handle', async () => {
		const res = await request(app).get(`/companies/google`).send({ _token });
		expect(res.statusCode).toBe(404);
	});
});

describe('POST /companies', () => {
	test('Creates a single company', async () => {
		const res = await request(app).post('/companies').send({
			handle        : 'microsoft',
			name          : 'Microsoft',
			num_employees : 5000,
			description   : 'Owners of TikTok. We also make that one operating system.',
			logo_url      : 'https://wiki.videolan.org/images/Windows-logo.jpg',
			_token        : _token
		});
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			company : {
				handle        : 'microsoft',
				name          : 'Microsoft',
				num_employees : 5000,
				description   : 'Owners of TikTok. We also make that one operating system.',
				logo_url      : 'https://wiki.videolan.org/images/Windows-logo.jpg'
			}
		});
	});

	test('Reject POST request because bad jsonschema', async () => {
		const response = await request(app).post('/companies').send({
			name          : 'Microsoft',
			num_employees : 5000,
			description   : 'Owners of TikTok. We also make that one operating system.',
			logo_url      : 'https://wiki.videolan.org/images/Windows-logo.jpg',
			_token        : _token
		});
		expect(response.statusCode).toBe(400);
	});

	test('Reject POST request because invalid URL', async () => {
		const response = await request(app).post('/companies').send({
			handle        : 'microsoft',
			name          : 'Microsoft',
			num_employees : 5000,
			description   : 'Owners of TikTok. We also make that one operating system.',
			logo_url      : 'NOT A VALID URL',
			_token        : _token
		});
		expect(response.statusCode).toBe(400);
	});
});

describe('PATCH /companies/:handle', () => {
	test('Updates a single Company', async () => {
		testCompany.num_employees = 1;
		const res = await request(app).patch(`/companies/${testCompany.handle}`).send({
			num_employees : 1,
			_token        : _token
		});
		expect(res.statusCode).toBe(200);
		// expect(res.body).toEqual(
		// 	expect.objectContaining({
		// 		company : { ...testCompany }
		// 	})
		// );
		expect(res.body).toHaveProperty('company');
		expect(res.body.company).toEqual(expect.objectContaining({ ...testCompany }));
	});
	test('Reject PATCH request because bad jsonschema', async () => {
		const response = await request(app).patch(`/companies/${testCompany.handle}`).send({
			name          : 'Microsoft',
			num_employees : 5000,
			description   : 8000000000,
			logo_url      : 'https://wiki.videolan.org/images/Windows-logo.jpg',
			_token        : _token
		});
		expect(response.statusCode).toBe(400);
	});

	test('Reject PATCH request because invalid URL', async () => {
		const response = await request(app).patch(`/companies/${testCompany.handle}`).send({
			handle        : 'microsoft',
			name          : 'Microsoft',
			num_employees : 5000,
			description   : 'Owners of TikTok. We also make that one operating system.',
			logo_url      : 'NOT A VALID URL',
			_token        : _token
		});
		expect(response.statusCode).toBe(400);
	});
});

describe('DELETE /companies/:handle', () => {
	test('Deletes a single Company', async () => {
		const res = await request(app).delete(`/companies/${testCompany.handle}`).send({ _token });
		expect(res.statusCode).toBe(200);
		// expect(res.body).toEqual({ message: `Company ${testCompany.handle} successfully deleted` });
		expect(res.body).toHaveProperty('message');
	});
});
