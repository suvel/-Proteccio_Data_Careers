This is project has been built and deployed for a assignment submission.

[click on here to view demo](https://protecciodatacareers-production.up.railway.app/)

## How the run project in local

```
// naviagte to the root of the file
1. npm i
2. npm run dev
3. open another terminal
4. cd client
5. npm i
6. npm run dev

epress server will running in 3000 and forentend should be running 3001

```

## How the build works

I zip the below files

```
1. package.json
2. package-lock.json
3. dist
4. exeecute start script in root

```

### Calculation

#### Data Quality Score

Each column card shows a `Quality: X%` badge that measures how complete that column's data is.

How it's calculated

For every column, we look at all the cells that exist for it across the rows and count how many are "non-missing":

```
qualityScore = 100 * (non-missing cells) / (total cells in the column)
```

#### Data Consistency Score

Each column card shows a `Consistency: X%` badge that measures how uniformly a column's
values match its detected data type.

How it's calculated

For every column, we first determine its majority data type (the most common type
across its non-missing cells). We then count how many non-missing cells actually match
that majority type:

```
consistencyScore = 100 * (cells matching the column's majority data type) / (non-missing cells in the column)
```

## Upload and storage limits

The application controls how many rows can be uploaded in a sheet and how many rows can be stored in the cloud through two constants:

```
utility_function/constants/config.ts
client\src\constants\config.ts

MAX_ROW_SHEET_UPLOAD = 100; // max rows allowed in a single uploaded sheet
MAX_ROW_CAN_INSERT = 5;     // max rows allowed to be stored in the cloud (across inserts)

```

## Pointer for were unable to covered in Assignments 😓

- Did not test the for application with file more that 100 rows

## Thought that went into developing the application captured

As I am using the AI tools leverage my work, I wantted to capture the thoughts that went into it take the reader how I am processing a problem and where I am leverating the tools in the process.

![thought flow](https://github.com/suvel/-Proteccio_Data_Careers/blob/develop/readme_assert/planning_thought_flow.jpg)
