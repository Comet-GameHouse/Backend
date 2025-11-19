const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { submitBugReport, submitFeedback, getHelpCenter, getSystemStatus } = require('../controllers/supportController');

router.get('/help', getHelpCenter);
router.get('/status', getSystemStatus);

router.post(
  '/bug-report',
  [
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('platform').trim().notEmpty().withMessage('Platform is required'),
    body('severity').trim().notEmpty().withMessage('Severity is required'),
    body('summary').trim().notEmpty().withMessage('Summary is required'),
    body('steps').trim().notEmpty().withMessage('Steps are required'),
  ],
  submitBugReport,
);

router.post(
  '/feedback',
  [
    body('name').optional().isString(),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('feedback').trim().notEmpty().withMessage('Feedback is required'),
  ],
  submitFeedback,
);

module.exports = router;


