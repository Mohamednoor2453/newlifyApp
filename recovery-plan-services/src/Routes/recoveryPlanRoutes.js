const express = require('express');
const { addictionDetails,  recoveryPlanResponse, getForm } = require("../controller/addictionDetails");

const router = express.Router();

router.post('/addictionDetails', addictionDetails);
router.post('/recoveryPlanResponse', recoveryPlanResponse);
router.get('/addiction-form', getForm);

module.exports = router;
