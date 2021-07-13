# schulfinder

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

> Gather data about Baden-Württemberg's schools (Germany)

## Prerequisite

- Node.js 14 or later

## Install

```
$ yarn global add schulfinder
```

Or using `npm`:

```
$ npm install --global schulfinder
```

## Usage

```
$ schulfinder --help

	Usage
	  $ schulfinder <file>

	Options
	  -u, --url=<url>        Specify selection criteria by link generated through web interface
	  -f, --froide           Use Froide's public bodies format (for Frag den Staat)
	  -p, --problems=<file>  Save schools with problems into seperate file (requires --froide)
	  -q, --quiet            Show only errors
```

### Filter schools

By default, `schulfinder` gathers data about all schools in Baden-Württemberg.

If you need data about specific subset of schools, use the [web interface](https://schulfinder.kultus-bw.de/) to apply any filters you want, click `Link erzeugen` in the bottom-left corner of the page and copy the generated URL, which should look something like this:

```
https://schulfinder.kultus-bw.de/?q=P3Rlcm09aHR0cHM6Ly9iaXQubHkvM3I0OUJySSZkaXN0YW5jZT0mb3duZXI9Jm91dHBvc3RzPTEm
```

You can then use the `-u` option to pass in the URL:

```
$ schulfinder schools.json -u https://schulfinder.kultus-bw.de/?q=P3Rlcm09aHR0cHM6Ly9iaXQubHkvM3I0OUJySSZkaXN0YW5jZT0mb3duZXI9Jm91dHBvc3RzPTEm
```

### FragDenStaat

`schulfinder` supports the data format used by [Froide](https://github.com/okfde/froide) to import public bodies (see the [format documentation](https://froide.readthedocs.io/en/latest/importpublicbodies/#format)). Froide is the Freedom of Information Portal used by the German project [FragDenStaat](https://fragdenstaat.de/) and its [Austrian counterpart](https://fragdenstaat.at/).

Use the `-f` option to save the school data in a Froide-friendly format:

```
$ schulfinder schools.csv -f
```

Since the data source isn't without errors, the resulting CSV file has an extra column: `problems`.
Whenever a data entry meets one of the following criteria, a problem is added to this field:

- Missing email (froide requires a valid email to send FOIA requests to public bodies)
- Invalid email
- Invalid phone number
- Invalid fax number
- Incomplete address (street, house number, postcode or city missing)

`schulfinder` doesn't perform a comprehensive validation of the data; rather, it tries to diagnose obvious errors and typos.

All problems need to be manually investigated and fixed. Thereafter the `problems` column can be removed and the file can be imported into Froide.

Schools with problems can be split into a seperate file by pasing in the `-p` option:

```
$ schulfinder schools.csv -f -p problems.csv
```

If problems are split into a seperate file or no problems are found, the `problems` field will be emited from the main output file.

## About the data source

The data is taken from the unofficial API exposed by [Schulfinder](https://schulfinder.kultus-bw.de/), which isn't rate-limited. It _should_ contain all schools in Baden-Württemberg, but the completeness and validity of the data cannot be guaranteed.