// Router
const router = require('express').Router();

// Modules
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// Config
const config = require('../config');

// Calculation controller
const calcController = require('../controllers/calc');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).array('zipFile[]');

router.post('/upload', upload, function (req, res) {
    res.json({ success: true, upload: "OK" });
});

router.use(cors(), function (req, res, next) {
    if (Boolean(req.body.apiUser)) {
        req.decoded = { username: "api" };
        next();
    } else {
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        if (token) {
            jwt.verify(token, config.secret, function (err, decoded) {
                if (err) {
                    return res.json({ 
                        success: false, 
                        message: 'Failed to authenticate token.' 
                    });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            return res.json({
                success: false,
                message: 'No token provided.'
            });
        }
    }

    
});

router.post('/create', function (req, res) {
    const userName = req.decoded.username;
    const calcsNames = req.body.calcs;
    console.log(calcsNames);
    calcController.createCalculations(
        calcsNames,
        userName,
        function (err, calcIds) {
            if (err) {
                res.json({ success: false, err: err });
            } else {
                res.json({ success: true, calcIds: calcIds });
            }
        }
    );
});

router.post('/run', function (req, res) {
    const calcIds = req.body.calcIds;
    console.log('run called');
    calcController.runCalculations(
        calcIds,
        function (err, runData) {
            if (err) {
                res.json({ success: false, err: err });
            } else {
                res.json({ success: true, runData: runData });
            }
        }
    );
});

router.post('/get-calcs', function (req, res) {
    const userName = req.decoded.username;
    calcController.getCalculations(
        userName,
        function (err, calcs) {
            if (err) {
                res.json({ success: false, err: err });
            } else {
                res.json({ success: true, calcs: calcs });
            }
        }
    );
});

router.post('/get-units', function (req, res) {
    const calcId = req.body.calcId;
    calcController.getUnits(
        calcId,
        function (err, units) {
            if (err) {
                res.json({ success: false, err: err });
            } else {
                res.json({ success: true, units: units });
            }
        }
    );
});

router.post('/update-calc-progress', function (req, res) {
    calcController.updateCalcsProgress(
        function (err, calcs) {
            if (err) {
                res.json({ success: false, err: err });
            } else {
                res.json({ success: true, calcs: calcs });
            }
        }
    );
});

router.post('/get-calc-status', function (req, res) {
    const calcId = req.body.calcId;
    calcController.getCalculation(
        calcId,
        function (err, calc) {
            if (err) {
                res.json({ success: false, err: err });
            } else {
                res.json({ success: true, status: calc.status });
            }
        }
    );
});

router.post('/download-calc', function (req, res) {
    const calcId = req.body.calcId;
    calcController.downloadCalc(
        calcId,
        function (err, pathToZip) {
            if (err) {
                res.json({ success: false, err: err });
            } else {
                res.sendFile(pathToZip);
            }
        }
    );
});

router.post('/remove-calc', function (req, res) {
    const calcId = req.body.calcId;
    calcController.removeCalc(
        calcId,
        function (err) {
            if (err) {
                res.json({ success: false, err: err });
            } else {
                res.json({ success: true, err: null });
            }
        }
    );
});

router.post('/get-unit-console', function (req, res) {
    const unitId = req.body.unitId;
    calcController.getUnitConsole(
        unitId,
        function (err, pathToConsole) {
            if (err) {
                res.json({ success: false, err: err });  
            } else {
                res.sendFile(pathToConsole);
            }
        }
    );    
});

module.exports = router;
