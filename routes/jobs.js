const express = require('express');

const Job = require('../models/job');
const ExpressError = require('../helpers/expressError');
const { checkForID, validateSchema, checkForQuery, checkForState } = require('../middleware/job');
const { authRequired, adminRequired } = require('../middleware/auth');
const router = new express.Router();

const sqlForPartialUpdate = require('../helpers/partialUpdate');

router.get('/', authRequired, checkForQuery, async (req, res, next) => {
	try {
		const jobs = await Job.all(req.query);

		if (jobs.length === 0) {
			return res.status(404).json({ error: new ExpressError('No jobs matched the given parameters.', 404) });
		}

		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

router.post('/', adminRequired, validateSchema, async (req, res, next) => {
	try {
		const job = await Job.create(req.body);

		return res.status(201).json({ job });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(409).json({ error: new ExpressError('Job with that name already exists', 409) });
		}
		return next(error);
	}
});

router.get('/:id', checkForID, authRequired, async (req, res, next) => {
	try {
		const job = res.locals.job;
		return res.status(200).json({ job });
	} catch (error) {
		return next(error);
	}
});

router.patch('/:id', adminRequired, validateSchema, checkForID, async (req, res, next) => {
	try {
		const { id } = req.params;
		const { query, values } = sqlForPartialUpdate('jobs', req.body, 'id', id);
		const job = await Job.save(query, values);
		return res.status(200).json({ message: `Successfully updated job with id: ${id}`, job });
	} catch (error) {
		return next(error);
	}
});

router.delete('/:id', adminRequired, checkForID, async (req, res, next) => {
	try {
		const { id } = req.params;
		const job = await Job.delete(id);
		return res.status(200).json({ message: `Job ${id} successfully deleted` });
	} catch (error) {
		return next(error);
	}
});

router.post('/:id/apply', authRequired, checkForState, checkForID, async (req, res, next) => {
	try {
		const { id } = req.params;
		const { state } = req.body;
		const username = res.locals.username;
		const application = await Job.application(username, id, state);

		return res.status(201).json({ message: 'Application submitted', application });
	} catch (error) {
		console.error(error);
		if (error.code === '23505') {
			return res.status(409).json({ error: new ExpressError('Already submitted application to this job.', 409) });
		}
		if (error.code === '22P02') {
			return res.status(409).json({
				error : new ExpressError(
					'Invalid state. State must be either: interested, applied, accepted, rejected',
					400
				)
			});
		}
		return next(error);
	}
});

module.exports = router;
