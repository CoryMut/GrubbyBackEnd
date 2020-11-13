const express = require('express');

const Company = require('../models/company');
const ExpressError = require('../helpers/expressError');
const router = new express.Router();

const { checkForHandle, validateSchema, checkForQuery } = require('../middleware/company');
const { authRequired, adminRequired } = require('../middleware/auth');

const sqlForPartialUpdate = require('../helpers/partialUpdate');

router.get('/', authRequired, checkForQuery, async (req, res, next) => {
	try {
		const companies = await Company.all(req.query);

		if (companies.length === 0) {
			return res.status(404).json({ error: new ExpressError('No companies matched the given parameters.', 404) });
		}

		return res.json({ companies });
	} catch (err) {
		return next(err);
	}
});

router.post('/', adminRequired, validateSchema, async (req, res, next) => {
	try {
		const company = await Company.create(req.body);

		return res.status(201).json({ company });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(409).json({ error: new ExpressError('Company with that name already exists', 409) });
		}
		return next(error);
	}
});

router.get('/:handle', authRequired, checkForHandle, async (req, res, next) => {
	try {
		// const { handle } = req.params;
		// const company = await Company.get(handle);
		const company = res.locals.company;
		return res.status(200).json({ company });
	} catch (error) {
		return next(error);
	}
});

router.patch('/:handle', adminRequired, validateSchema, checkForHandle, async (req, res, next) => {
	try {
		const { handle } = req.params;
		const { query, values } = sqlForPartialUpdate('companies', req.body, 'handle', handle);
		const company = await Company.save(query, values);
		return res.status(200).json({ message: `Successfully updated company with handle: ${handle}`, company });
	} catch (error) {
		return next(error);
	}
});

router.delete('/:handle', adminRequired, checkForHandle, async (req, res, next) => {
	try {
		const { handle } = req.params;
		const company = await Company.delete(handle);
		return res.status(200).json({ message: `Company ${handle} successfully deleted` });
	} catch (error) {
		return next(error);
	}
});

module.exports = router;

// {
//     handle        : req.user.handle,
//     name          : req.body.name,
//     num_employees : req.body.num_employees,
//     description   : req.body.description,
//     logo_url      : req.body.logo_url
// }
