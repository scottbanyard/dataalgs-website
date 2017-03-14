"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const csprng = require("csprng");
function attemptLogin(db, email, password) {
    db.get('SELECT PassSalt, PassHash FROM UserAccounts WHERE Email = ?', email, (err, row) => {
        if (err)
            return console.error('Error:', err);
        if (!row)
            return console.error('User doesn\'t exist');
        if (hashPW(password, row.PassSalt) == row.PassHash) {
            console.log('password correct');
        }
    });
}
exports.attemptLogin = attemptLogin;
function hashPW(password, salt) {
    return crypto_1.createHash('sha256')
        .update(salt + password)
        .digest('hex');
}
function createNewUser(db, name, email, password) {
    db.get('SELECT * FROM UserAccounts WHERE Email = ?', email, (err, row) => {
        if (err)
            console.error('Error:', err);
        if (row)
            console.warn('That email:', email, 'already exists in our system');
        else {
            const salt = csprng();
            db.run('INSERT INTO UserAccounts (Name, Email, PassSalt, PassHash) VALUES (?,?,?,?)', [name, email, salt, hashPW(password, salt)]);
            console.log('Account for', email, 'successfully created');
        }
    });
}
exports.createNewUser = createNewUser;
