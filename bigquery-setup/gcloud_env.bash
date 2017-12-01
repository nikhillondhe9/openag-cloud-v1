# All the Google cloud platform and BigQuery env. vars. we use in our scripts.
# Meant to be sourced in our bash scripts.

#------------------------------------------------------------------------------
export GCLOUD_PROJECT=openag-cloud-v1
export GOOGLE_APPLICATION_CREDENTIALS=../service_account.json
export GOOGLE_STORAGE_DATA_BUCKET=openag-cloud-v1-data


#------------------------------------------------------------------------------
export DATA_DS=openag_private_data
export DATA_DS_DESC="MIT ML, OpenAg. A private dataset of plant growth and research data." 

export WEBUI_DS=openag_private_webui
export WEBUI_DS_DESC="MIT ML, OpenAg. A private dataset to hold users, recipes and ratings."

export PUBLIC_DATA_DS=openag_foundation_open_phenome
export PUBLIC_DATA_DS_DESC="OpenAg Foundation, Open Phenome Library.  A curated public dataset of plant growth and research data." 

export PUBLIC_USER_DATA_DS=openag_public_user_data
export PUBLIC_USER_DATA_DS_DESC="MIT Media Lab, Open Agriculture Initiative, Open Phenome Library.  A user public dataset of plant growth and research data." 

# Keep the order the same in these two arrays.
# NOTE: the webui DS is NOT in this array (it is loaded with different tables).
export DATASETS=($DATA_DS $PUBLIC_DATA_DS $PUBLIC_USER_DATA_DS)
export DATASET_DESCS=("$DATA_DS_DESC" "$PUBLIC_DATA_DS_DESC" "$PUBLIC_USER_DATA_DS_DESC")


#------------------------------------------------------------------------------
export EXP_TABLE=exp
export TRE_TABLE=treat
export VAL_TABLE=val
export COM_TABLE=com
export EXP_TABLE_DESC="Experiments, the top level table. Comprised of a set of Treatments to compare against each other."
export TRE_TABLE_DESC="Each Treatment is a run of a Climate Recipe and post harvest results."
export VAL_TABLE_DESC="Values are generic name/value/location objects." 
export COM_TABLE_DESC="Comments can be added to many objects." 

# bash arrays of tables for the DATA datasets that we can loop over.
export DATA_TABLES=($EXP_TABLE $TRE_TABLE $VAL_TABLE $COM_TABLE)
export DATA_TABLE_DESCS=("$EXP_TABLE_DESC" "$TRE_TABLE_DESC" "$VAL_TABLE_DESC" "$COM_TABLE_DESC")


#------------------------------------------------------------------------------
export USER_TABLE=user
export REC_TABLE=rec
export USER_TABLE_DESC="User profiles."
export REC_TABLE_DESC="Climate Recipes."

# bash arrays of tables for the UI dataset that we can loop over.
export UI_TABLES=($USER_TABLE $REC_TABLE)
export UI_TABLE_DESCS=("$USER_TABLE_DESC" "$REC_TABLE_DESC")


#------------------------------------------------------------------------------
# include our function library
source func_lib.bash


