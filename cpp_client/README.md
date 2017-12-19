# Testing to see if I can get pubsub working using C++

[https://google.github.io/google-api-cpp-client/latest/object_model.html](C++ SDK docs)

```
git clone https://github.com/google/google-api-cpp-client.git
cp robs_updated_prepare_dependencies.py google-api-cpp-client/

cd google-api-cpp-client
./robs_updated_prepare_dependencies.py 

./external_dependencies/install/bin/cmake .
make

cd bin
./storage_sample ../../../service_account.json
```

### Note in the bin dir there is a roots.pem that is required to call any google API, so keep it with the binaries when you deploy.

# Generate a library for the PubSub API
### You must use this EXACT version of the script
https://github.com/google/apis-client-generator/tree/dcad06f5ff0fecfcf7a029efefe62a6b6287b025

### Note: the generator can ONLY use python 2 (not 3)

```
git clone https://github.com/google/apis-client-generator.git

virtualenv --python python2 generator_env
source generator_env/bin/activate
pip install google-apis-client-generator

mkdir service_apis/pubsub
python apis-client-generator/src/googleapis/codegen/generate_library.py --api_name=pubsub --api_version=v1beta2 --language=cpp --output_dir=./service_apis/pubsub

cp pubsub.CMakeLists.txt service_apis/pubsub/CMakeLists.txt
./external_dependencies/install/bin/cmake .
make

cd src/samples
# add new entry for pubsub_test
vi CMakeLists.txt

cp storage_sample_main.cc pubsub_test_main.cc
vi pubsub_test_main.cc ../../service_apis/pubsub/google/pubsub_api/pubsub_service.h
make

GLOG_logtostderr=1  ../../bin/pubsub_test ../../../../service_account.json
```

# still some bugs in the above, get a 404 trying to list topics.

The big issue is to use all this on BBB, you run out of space building the requirements of the library (cmake first).




