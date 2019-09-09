// Models
const User = require('../models/user');
const Unit = require('../models/unit');
const Calculation = require('../models/calc');

// Modules
const fs = require('fs');
const path = require('path');
const async = require('async');
const unzipper = require('unzipper');
const zipFolder = require('zip-folder');
const exec = require('child_process').exec;

const trimExtension = function (name) {
    return name.slice(0, name.lastIndexOf('.'));
}; // nova

const getCalculations = function (userName, callback) {
    User.findOne({ username: userName }, function (err, user) {
        if (err) return callback(err, null);

        Calculation.find({ user: user._id }, function (err, calcs) {
            calcs = calcs.reverse();
            return callback(err, calcs);
        });
    });
}; // OK

const getCalculation = function (calcId, callback) {
    Calculation.findById(calcId, function (err, calc) {
        return callback(err, calc);
    });
}; // OK

const getUnits = function (calcId, callback) {
    Unit.find({ calculation: calcId }, function (err, units) {
        return callback(err, units);
    });
}; // OK

const createUnit = function (calcId, index, name, callback) {
    const newUnit = new Unit({
        name: name,
        status: "new",
        index: Number(index),
        calculation: calcId
    });

    newUnit.save(function (err) {
        return callback(err, newUnit.name);
    });
}; // nova

const createUnits = function (calcId, unitsNames, callback) {
    async.times(unitsNames.length, function (n, next) {
        createUnit(calcId, n, unitsNames[n], function (err, unitName) {
            next(err, unitName);
        });
    }, function (err, data) {
        return callback(err, data);
    });
}; // nova

const createCalculation = function (calcName, userId, callback) {
    const newCalc = new Calculation({
        name: trimExtension(calcName),
        status: "new",
        user: userId
    });

    newCalc.save(function (err) {
        return callback(err, newCalc._id);
    });
}; // nova

const createCalculations = function (calcsNames, userName, callback) {
    User.findOne({ username: userName }, function (err, user) {
        if (err) return callback(err, null);

        async.times(calcsNames.length, function (n, next) {
            createCalculation(calcsNames[n], user._id, function (err, calcId) {
                next(err, calcId);
            });
        }, function (err, calcIds) {
            return callback(err, calcIds);
        });
    });
}; // nova

// const createCalculationAndUnits = function (calcName, userName, unitsNames, callback) {
//     createCalculation(calcName, userName, function (err, newCalcId) {
//         if (err) return callback(err, null);
//
//         async.times(unitsNames.length, function (n, next) {
//             createUnit(newCalcId, n, unitsNames, function (err, unit) {
//                 next(err, unit);
//             });
//         }, function (err, units) {
//             return callback(err, newCalcId);
//         });
//
//     });
// }; // stara

const runCalculations = function (calcIds, callback) {
    async.times(calcIds.length, function (n, next) {
        extractAndCreateUnits(calcIds[n], function (err, units) {
            console.log(units);
            runCalculation(calcIds[n], function (err, data) {
                console.log(data);
                next(err, data);
            });
        });
    }, function (err, data) {
        return callback(err, data);
    });
}; // nova

const extractAndCreateUnits = function (calcId, callback) {
    Calculation.findById(calcId, function (err, calc) {
        if (err) return callback(err, null);

        fs.mkdirSync(path.join(__dirname, '..', 'runnings', calcId));

        const firstPath = path.join(__dirname, '..', 'uploads', calc.name + '.zip');
        const secondPath = path.join(__dirname, '..', 'runnings', calcId);
        fs.createReadStream(firstPath).pipe(unzipper.Extract({ path: secondPath }))
            .on('close', function () {
                const unitsNames = fs.readdirSync(secondPath)
                    .filter((name) => fs.lstatSync(path.join(secondPath, name)).isDirectory());

                createUnits(calcId, unitsNames, function (err, units) {
                    return callback(err, units);
                });
            });
    });
}; // nova

const runCalculation = function (calcId, callback) {
    const date = new Date();

    Calculation.findById(calcId, function (err, calc) {
        if (err) return callback(err, null);
        
        calc.startTime = date;
        calc.status = "running";

        Unit.find({ calculation: calcId }, function (err, units) {
            if (err) return callback(err, null);
    
            async.times(units.length, function (n, next) {
                const unit = units[n];
                unit.pathToResults = path.join(calcId, unit.name);
                unit.status = "running";
                unit.startTime = date;
                unit.save(function (err) {
                    next(err, unit);
                });
            }, function (err, data) {
                calc.save();
            });                
        });
    });

    fs.copyFileSync(
        path.join(__dirname, '..', 'exes', 'MusicoExeFinal'),
        path.join(__dirname, '..', 'runnings', calcId, 'MusicoExeFinal')
    );
    fs.copyFileSync(
        path.join(__dirname, '..', 'exes', 'run.sh'),
        path.join(__dirname, '..', 'runnings', calcId, 'run.sh')
    );
    fs.copyFileSync(
        path.join(__dirname, '..', 'exes', 'startM.sub'),
        path.join(__dirname, '..', 'runnings', calcId, 'startM.sub')
    );

    const pathToRunSh = path.join(__dirname, '..', 'runnings', calcId, 'run.sh');
    const pathToCalc = path.join(__dirname, '..', 'runnings', calcId);
    const command = `bash ${pathToRunSh} ${pathToCalc}`;
    exec(command, function (error, stdout, stderr) {
        if (!error) {
            const output = stdout.trim().split('\n');
            console.log(output);
            for (let i = 0; i < output.length; i++) {
                let row = output[i].split(' ');
                let name = row[0].split('/')[7];
                let job = row[1].split('.')[0];

                Unit.findOne({ calculation: calcId, name: name }, function (err, unit) {
                    if (err) return callback(err, null);
                    unit.jobId = job;
                    unit.save();
                });
            }
        }
        return callback(error, { stdout: stdout, stderr: stderr });
    });
}; // nova

// const createUnitsAndRunCalculation = function (calcId, callback) {
//     Calculation.findById(calcId, function (err, calc) {
//         if (err) return callback(err, null);
//
//         const date = new Date();
//         calc.startTime = date;
//         calc.status = "running";
//         calc.save();
//
//         Unit.find({ calculation: calcId }, function (err, units) {
//             if (err) return callback(err, null);
//
//             fs.mkdirSync(path.join(__dirname, '..', 'runnings', calcId));
//
//             const unzipUnit = function (index, callback) {
//                 const unit = units[index];
//                 unit.pathToResults = path.join(calcId, unit.name);
//                 unit.status = "running";
//                 unit.startTime = date;
//
//                 const firstPath = path.join(__dirname, '..', 'uploads', unit.pathToZip);
//                 const secondPath = path.join(__dirname, '..', 'runnings', unit.pathToResults);
//                 fs.createReadStream(firstPath).pipe(unzipper.Extract({ path: secondPath }))
//                     .on('close', function () {
//
//                     unit.save(function (err) {
//                         if (err) return callback(err, "OK");
//                     });
//                 });
//             };
//
//             async.times(units.length, function (n, next) {
//                 unzipUnit(n, function (err, data) {
//                     next(err, data);
//                 });
//             }, function (err, data) {
//                 fs.copyFileSync(
//                     path.join(__dirname, '..', 'exes', 'MusicoExe'),
//                     path.join(__dirname, '..', 'runnings', calcId, 'MusicoExe')
//                 );
//
//                 fs.copyFileSync(
//                     path.join(__dirname, '..', 'exes', 'run.sh'),
//                     path.join(__dirname, '..', 'runnings', calcId, 'run.sh')
//                 );
//
//                 fs.copyFileSync(
//                     path.join(__dirname, '..', 'exes', 'startM.sub'),
//                     path.join(__dirname, '..', 'runnings', calcId, 'startM.sub')
//                 );
//
//                 const pathToRunSh = path.join(__dirname, '..', 'runnings', calcId, 'run.sh');
//                 const pathToCalc = path.join(__dirname, '..', 'runnings', calcId);
//                 const command = `bash ${pathToRunSh} ${pathToCalc}`;
//                 exec(command, function (error, stdout, stderr) {
//                     return callback(null, { stdout: stdout, stderr: stderr });
//                 });
//
//             });
//         });
//     });
// }; // stara

const downloadCalc = function (calcId, callback) {
    sampleCalculation(calcId, function (err) {
        if (err) return callback(err, null);

        const pathToCalc = path.join(__dirname, '..', 'runnings', calcId);
        const pathToZip = path.join(__dirname, '..', 'downloads', calcId + '.zip');
        zipFolder(pathToCalc, pathToZip, function (err) {
            return callback(err, pathToZip);
        });
    });



}; // OK

const getUnitConsole = function (unitId, callback) {
    Unit.findById(unitId, function (err, unit) {
        if (err) return callback(err, null);

        const pathToUnitConsole = path.join(__dirname, '..', 'runnings', unit.pathToResults, 'log.txt');
        const pathToUnitConsoleTail = path.join(__dirname, '..', 'runnings', unit.pathToResults, 'log_tail.txt');
        const command = `tail -n 500 ${pathToUnitConsole} > ${pathToUnitConsoleTail}`;

        exec(command, function (err) {
            return callback(err, pathToUnitConsoleTail);
        });
    });
}; // OK

const getUnitProgress = function (index, units, callback) {
    const pathToResults = path.join(__dirname, '..', 'runnings', units[index].pathToResults);
    const pathToPyScrip = path.join(__dirname, '..', 'progress.py');
    const command = `python ${pathToPyScrip} ${pathToResults}`;

    exec(command, function (error, stdout, stderr) {
        callback(error, stdout);
    });
};

const setUnitProgress = function (index, data, units, callback) {
    if (units[index].status !== "finished") {
        if (data.isEnd === true) {
            units[index].endTime = new Date();
            units[index].progress = 100;
            units[index].status = "finished";
        } else {
            units[index].progress = data.progress;
        }

        units[index].save(function (err) {
            // console.log(`unit[${index}].progress = ${units[index].progress}`);
            // console.log(units.map(a => a.progress));
            callback(err, units[index].progress);
        });
    } else {
        callback(null, units[index].progress);
    }
};

const getCalcProgress = function (calcId, callback) {
    Unit.find({ calculation: calcId }, function (err, units) {
        if (err) return callback(err, null);

        Calculation.findById(calcId, function (err, calc) {
            if (err) return callback(err, null);
            if (calc.status === "finished" || calc.status === "new")
                return callback(null, calc);

            async.times(units.length, function (n, next) {
                getUnitProgress(n, units, function (err, data) {
                    data = JSON.parse(data.trim());
                    // console.log(data);
                    setUnitProgress(n, data, units, function (err, progress) {
                        next(err, progress);
                    });
                });
            }, function (err, data) {
                // console.log(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    sum += data[i];
                }

                let mean = Math.floor(sum / data.length);

                if (mean === 100) {
                    calc.endTime = new Date();
                    calc.status = "finished";
                }
                calc.progress = mean;
                calc.save(function (err) {
                    return callback(err, calc);
                });
            });
        });
    });
}; // OK

const updateCalcsProgress = function (callback) {
    Calculation.find(function (err, calcs) {
        if (err) return callback(err, null);

        async.times(calcs.length, function (n, next) {
            getCalcProgress(calcs[n]._id, function (err, calc) {
                next(err, calc);
            });
        }, function (err, calcs) {
            callback(err, calcs);
        });
    });
}; // OK

const removeCalc = function(calcId, callback) {
    Calculation.findById(calcId, function (err1, calc) {
        Unit.find({ calculation: calcId }, function (err2, units) {
            for (let i = 0; i < units.length; i++) {
                exec('qdel ' + units[i].jobId);
                units[i].remove();
            }
        });
        calc.remove();

        return callback(null, "OK");
    });
};

const sampleCalculation = function(calcId, callback) {
    Unit.find({ calculation: calcId }, function (err, units) {
        if (err) return callback(err, null);

        const sampleUnit = function(unit, callback) {
            const pathToResults = path.join(__dirname, '..', 'runnings', unit.pathToResults);
            const pathToPyScrip = path.join(__dirname, '..', 'resultSampler.py');
            const sample = 100;
            const command = `python ${pathToPyScrip} ${pathToResults} ${sample}`;

            exec(command, function (error) {
                callback(error);
            });
        };

        async.times(units.length, function (n, next) {
            sampleUnit(units[n], function (err) {
                next(err);
            });
        }, function (err) {
            callback(err);
        });

    });
};

module.exports = {
    getCalculations,
    getCalculation,
    getUnits,
    createUnit, // ne treba exportovati
    createUnits, // ne treba exportovati
    createCalculation, // ne treba exportovati
    createCalculations,
    // createCalculationAndUnits, // ne treba exportovati
    runCalculations,
    //createUnitsAndRunCalculation,
    downloadCalc,
    removeCalc,
    getUnitConsole,
    getCalcProgress, // ne treba exportovati
    updateCalcsProgress
};
