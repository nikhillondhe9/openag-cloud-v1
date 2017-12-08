# Scripts to build, check and maintain our BigQuery datasets of research data

All the python scripts take a -h argument to explain their options.

See the [README_python.md](../README_python.md) file for instructions on setting up gcloud and python.

## Create and load the datasets
* `authorize_gcloud.sh` Authorize your google account and gcloud project.
* `create_bigquery_dataset_and_schema.sh` Create the datasets and tables.
* `load_manual_data_to_bigquery.sh` Load data into the tables.

## Explore our datasets
* `list_datasets.sh` List all datasets and tables (quick).
* `list_experiments.py` List all experiments in a dataset.
* `show_datasets.py` Show statistics about all datasets (rows, bytes, etc).
* `show_exp.py` Show the details of an experiment.

## Make an experiment public, when the research is ready
* `exp_copy_and_verify.sh` Copy experiment and then verify the copy.
* `copy_experiment.py` Copy an entire experiment from one dataset (private) to another (public).

## Backup all datasets to and restore from a Google storage bucket
* `backup_data_to_bucket.sh`
* `restore_data_from_bucket.sh`

## Internal maintenance scripts only for admins
* `query.sh` Example command line queries.
* `reload_table.sh` Remove all data from a table and reload it from a .csv file (DANGEROUS).
* `update_schema.sh` Update a schema, only if additions have been made.
* `delete_all_data.sh` Delete all data from all datasets (DANGEROUS).
* `delete_data.sh` Delete the data from one table (DANGEROUS).
* `delete_datasets.sh` Delete EVERYTHING. (HELLA DANGEROUS).
* `delete_data_from_openag_foundation_open_phenome.sh` Delete everything in the public dataset.


## Internal files
* `gcloud_env.bash` Google cloud platform and BigQuery environment variables.  Also has our dataset and table names as environment variables and arrays.
* `func_lib.bash` Library of bash functions used in the above scripts.
* `func_lib.py` Library of python functions used in the above scripts.

## Directories
* `data/` Contains all the .csv files that are our saved table contents.
* `schema/` Contains all the .json files that are our saved table schemas.
* `test/` Contains some test scripts.

