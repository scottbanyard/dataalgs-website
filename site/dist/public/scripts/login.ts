import { createHash } from "crypto";
import * as sqlite3   from "sqlite3";
import * as csprng from "csprng";


export function attemptLogin( db,
                              email : string,
                              password : string )
{
    db.get('SELECT PassSalt, PassHash FROM UserAccounts WHERE Email = ?', email, (err,row) => {
        if (err)
            return console.error('Error:', err);
        if (!row)
            return console.error('User doesn\'t exist');
        if (hashPW( password, row.PassSalt ) == row.PassHash){
            console.log('password correct');
        }
    });
}

// Hashes a password
function hashPW( password : string, salt : string ) : string {
    return createHash( 'sha256')
           .update( salt + password )
           .digest('hex');
}

// Checks whether the user's email is already in the database then
// add the new email with the encrypted password to the database
export function createNewUser( db,
                        name : string,
                        email : string,
                        password : string)
{
    db.get( 'SELECT * FROM UserAccounts WHERE Email = ?', email,
            (err,row) => {
        if (err)
            console.error('Error:', err);

        if(row)
            console.warn('That email:',email,'already exists in our system');
        else{
            const salt = csprng();
            db.run('INSERT INTO UserAccounts (Name, Email, PassSalt, PassHash) VALUES (?,?,?,?)', [name, email, salt, hashPW(password,salt)]);
            console.log('Account for',email,'successfully created');
        }
    });
}
