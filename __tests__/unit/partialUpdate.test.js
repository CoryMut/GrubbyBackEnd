const sqlForPartialUpdate = require('../../helpers/partialUpdate');

describe('partialUpdate()', () => {
	test('should generate a proper partial update query with just 1 field', function() {
		// FIXME: write real tests!
		const results = sqlForPartialUpdate('company', { num_employees: 9 }, 'handle', 'apple');
		expect(results).toMatchObject({
			query  : 'UPDATE company SET num_employees=$1 WHERE handle=$2 RETURNING *',
			values : [ 9, 'apple' ]
		});
	});
});
