import OracleDB from 'oracledb'
import { ipcRenderer as ipc} from 'electron'

class Database {
  constructor(user, password, connectString) {
    this.user = user;
    this.password = password;
    this.connectString = connectString;
    this.numRows = 200; // Number of rows to fetch at once
    this.rows = [];
  };

  /**
   * [fetchFromResultSet description]
   * @param  {[type]} connection [description]
   * @param  {[type]} resultSet  [description]
   * @param  {[type]} numRows    [description]
   * @return {[type]}            [description]
   */
  fetchFromResultSet(connection, resultSet, numRows){
    resultSet.getRows(numRows)
      .then( rows => {
        if(rows.length > 0){
          this.rows.push.apply(this.rows, rows);   // Appending all the rows elements to this.rows
          return this.fetchFromResultSet(connection, resultSet, numRows);
        } else {
          ipc.send('db-states-data-fetched', this.rows);
          console.log('Data fetched, connection closed');
          return connection.close();
        }
        console.log('FetchedRowsLength',  this.rows.length);
      })
      .catch(err => {
        console.error(err);
      });
  }

  /**
   * [fetch description]
   * @param  {[type]} config [description]
   * @return {[type]}      [description]
   */
  fetch(config){
    this.rows = [];
    OracleDB.getConnection(
      {
        user          : this.user,
        password      : this.password,
        connectString : this.connectString
      })
      .then( connection => {
        console.log('Connected');
        return connection.execute(
          "SELECT ASV_NUMB, "+
                 "AST_IDEN, "+
                 "ASV_VALU_PAR1, "+
                 "ASV_VALU_PAR2, "+
                 "ASV_VALU_PAR3, "+
                 "ASV_VALU_PAR4, "+
                 "ASV_VALU_PAR5, "+
                 "ASV_VALU_PAR6, "+
                 "ASV_VALU_PAR7, "+
                 "ASV_VALU_PAR8 " +
          "FROM sys.atm_states_values, sys.atm_states_type " +
          "WHERE ASV_SCO_CODE = :config and "+
          "ASV_AST_CODE = AST_CODE AND ASV_NUMB <=100",
          [config],
          {
            resultSet: true, // return a result set.  Default is false
            prefetchRows: this.numRows // the prefetch size can be set for each query
          }
        )
          .then( result => {
            return this.fetchFromResultSet(connection, result.resultSet, this.numRows);
          })
          .catch( err => {
            console.error(err.message);
            return connection.close();
          });

      })
      .catch( err => {
        console.error(err.message);
      });      
  }
}

const db = new Database('SYSTEM', '123', 'localhost/XE');
db.fetch('77');
