import * as fs from "fs";
import { cwd } from "process";
import path from "path";

//how the colums shoud look
type columType = "string" | "number" | "boolean"
interface columData {
    [columName: string]: {
        type: columType
    }
}

interface table {
    [columName: string]: any[]
}

//dbLayout
interface dbType {
    [tableName: string]: {
        TABLEINFO: columData,
        TABLEDATA: table[]
    }
}

interface insertedData {
    [columName: string]: any
}

//Main class
export class TSDB {
    private dbFilePath: string;

    constructor(dbFileName: string) {
        //store the file path of the db
        this.dbFilePath = path.join(cwd(), dbFileName)

        if (!fs.existsSync(this.dbFilePath)) {
            fs.writeFileSync(this.dbFilePath, "{}")
        } else {
            /*
            if (!(fs.readFileSync(this.dbFilePath, "utf-8").endsWith("}") && fs.readFileSync(this.dbFilePath, "utf-8").endsWith("{"))) {
                throw new Error(`${dbFileName} is not a valid JSON file`)
            }
            */
        }
    }

    /*

    Code only to be used by medhods in this class
    */

    private readDb(): dbType {
        return JSON.parse(fs.readFileSync(this.dbFilePath, "utf-8"));
    }

    private writeDb(data: dbType): void {
        fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2));
    }

    /*
        End of private functions
    */

    async createTable(tableName: string, colums: columData): Promise<void> {
        let dbNow = this.readDb()

        dbNow = Object.assign(dbNow, {
            [tableName]: {
                "TABLEINFO": colums,
                "TABLEDATA": []
            },
        })

        this.writeDb(dbNow)
    }

    async writeTable(tableName: string, data: insertedData): Promise<void> {
        let dbNow = this.readDb()

        //check that the table exists
        if (typeof dbNow[tableName] != "undefined") {
            //gets table
            let table = dbNow[tableName];

            //type check
            let columsToCheck = Object.keys(data)

            //checks the type
            columsToCheck.forEach(col => {
                //check if colum exists
                if (typeof table.TABLEINFO[col] != "undefined") {

                    //makes sure the type of the data is what the set type of that colum is
                    if (typeof data[col] != table.TABLEINFO[col].type) {
                        //throw a error if isnt
                        throw new Error(`Type of ${col} does not match set type of colum, ${table.TABLEINFO[col].type}`)
                    }

                //colum dosent exist!
                } else {
                    throw new Error(`Colum ${col} does not exist`)
                }
            });

            //end type check

            //push it
            table.TABLEDATA.push( data )

            //update the table in the dbnow bar
            dbNow[tableName] = table;

            //write to the file
            this.writeDb(dbNow)
        } else {
            throw new Error(`${tableName} does not exist yet!`)
        }
    }

    async getEntireTable(tableName: string): Promise<table[]> {
        let dbNow = this.readDb()

        if (typeof dbNow[tableName] == "undefined") {
            throw new Error(`Table ${tableName} does not exist`)
        }

        return dbNow[tableName].TABLEDATA
    }
}