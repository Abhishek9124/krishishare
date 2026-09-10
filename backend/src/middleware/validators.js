const { body, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['fpo', 'investor']).withMessage("Role must be 'fpo' or 'investor'"),
  body('fpo_name').custom((value, { req }) => {
    if (req.body.role === 'fpo' && (!value || !value.trim())) {
      throw new Error('FPO Name is required when registering as an FPO');
    }
    return true;
  }),
  handleValidationErrors,
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateCreateProject = [
  body('crop_name').trim().notEmpty().withMessage('Crop name is required'),
  body('title').trim().notEmpty().withMessage('Project title is required'),
  body('target_amount').isFloat({ gt: 0 }).withMessage('Target amount must be a positive number'),
  body('min_investment').optional().isFloat({ gt: 0 }).withMessage('Minimum investment must be greater than 0'),
  body('expected_return_pct').optional().isFloat({ min: 0 }).withMessage('Expected return % must be 0 or higher'),
  handleValidationErrors,
];

const validateInvestment = [
  body('project_id').isInt({ gt: 0 }).withMessage('Valid project_id is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Investment amount must be greater than 0'),
  handleValidationErrors,
];

const validateSettlementRequest = [
  body('total_yield_value').isFloat({ gt: 0 }).withMessage('Total yield sale value must be a positive number'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateProject,
  validateInvestment,
  validateSettlementRequest,
};
