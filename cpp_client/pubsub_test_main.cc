/*
 * \copyright Copyright 2017 Google Inc. All Rights Reserved.
 * \license @{
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @}
 */

#include <fstream>
#include <memory>
#include "gflags/gflags.h"
#include "googleapis/client/auth/oauth2_authorization.h"
#include "googleapis/client/auth/oauth2_service_authorization.h"
#include "googleapis/client/data/data_reader.h"
#if HAVE_OPENSSL
#include "googleapis/client/data/openssl_codec.h"
#endif
#include "googleapis/client/transport/curl_http_transport.h"
#include "googleapis/client/transport/http_authorization.h"
#include "googleapis/client/transport/http_transport.h"
#include "googleapis/client/transport/http_request_batch.h"
#include "googleapis/client/util/status.h"
#include "googleapis/strings/strcat.h"

#include "google/pubsub_api/pubsub_api.h"  // NOLINT

namespace googleapis {

static const char usage[] =
    "Publish a JSON value to our OpenAg PubSub service.\n"
    "\n"
    "Usage:\n"
    "\tpubsub_test <service_account.json> [<cacerts_path>]\n"
    "\n";

using google_pubsub_api::PubsubService;

using client::HttpTransport;
using client::HttpTransportLayerConfig;
using client::OAuth2Credential;
using client::OAuth2ServiceAccountFlow;
#if HAVE_OPENSSL
using client::OpenSslCodecFactory;
#endif
using client::StatusInvalidArgument;


class PubSubTest {
 public:
  googleapis::util::Status Startup(int argc, char* argv[]);
  void Run();

 private:
  OAuth2Credential credential_;
  std::unique_ptr<PubsubService> pubsub_;
  std::unique_ptr<OAuth2ServiceAccountFlow> flow_;
  std::unique_ptr<HttpTransportLayerConfig> config_;
};

/* static */
util::Status PubSubTest::Startup(int argc, char* argv[]) {
  if ((argc < 2) || (argc > 3)) {
    return StatusInvalidArgument(usage);
  }

  // Set up HttpTransportLayer.
  googleapis::util::Status status;
  config_.reset(new HttpTransportLayerConfig);
  client::HttpTransportFactory* factory =
      new client::CurlHttpTransportFactory(config_.get());
  config_->ResetDefaultTransportFactory(factory);
  if (argc > 2) {
    config_->mutable_default_transport_options()->set_cacerts_path(argv[2]);
  }

  // Set up OAuth 2.0 flow for a service account.
  flow_.reset(new client::OAuth2ServiceAccountFlow(
      config_->NewDefaultTransportOrDie()));
  // Load the the contents of the service_account.json into a string.
  string json(std::istreambuf_iterator<char>(std::ifstream(argv[1]).rdbuf()),
              std::istreambuf_iterator<char>());
  // Initialize the flow with the contents of service_account.json.
  flow_->InitFromJson(json);
  // Tell the flow exactly which scopes (priveleges) we need.
  flow_->set_default_scopes( PubsubService::SCOPES::PUBSUB );

  pubsub_.reset(new PubsubService(config_->NewDefaultTransportOrDie()));
  return status;
}


void PubSubTest::Run() {
  // Set the flow that we will use to call the API.
  // The flow was constructed in Startup().
  credential_.set_flow(flow_.get());

  // Construct the request.
/*debugrob:fix
       * `"projects/{project}/topics/{topic}"`. `{topic}` must start with a
class ProjectsResource_TopicsResource_PublishMethod : public PubsubServiceBaseRequest {

//pass in project name to list topics << do first
      ProjectsResource_TopicsResource_ListMethod* NewListMethod(
          client::AuthorizationCredential* _credential_,
          const StringPiece& project) const;

  const ProjectsResource& get_projects() const 
    const TopicsResource& get_topics() const 


  ProjectsResource_TopicsResource_PublishMethod(
      const PubsubService* _service_,
      client::AuthorizationCredential* _credential_,
      const StringPiece& topic,
      const PublishRequest& _content_);

  util::Status ExecuteAndParseResponse( PublishResponse* data) 
*/

/* can't call directly :(
  google_pubsub_api::PubsubService::ProjectsResource projs = 
        pubsub_.get_projects();
  google_pubsub_api::PubsubService::ProjectsResource::TopicsResource topics = 
        projs.get_topics();
*/

  string project = flow_->project_id();
  std::cout << "project_id from flow: " << project << "\n";
  google_pubsub_api::ProjectsResource_TopicsResource_ListMethod request(
      pubsub_.get(), &credential_, flow_->project_id());
  Json::Value value;
  google_pubsub_api::ListTopicsResponse topicsList(&value);
  // Execute the request.
  auto status = request.ExecuteAndParseResponse(&topicsList);
  if (!status.ok()) {
    std::cout << "Could not list topics: " << status.error_message() << "\n";
    return;
  }
  std::cout << "Topics:\n";
  for (auto topic: topicsList.get_topics()) {
    std::cout << topic.get_name() << std::endl;
  }
}

}  // namespace googleapis

using namespace googleapis;
int main(int argc, char* argv[]) {
  google::InitGoogleLogging(argv[0]);
  google::ParseCommandLineFlags(&argc, &argv, true);

  PubSubTest sample;
  googleapis::util::Status status = sample.Startup(argc, argv);
  if (!status.ok()) {
    std::cerr << "Could not initialize application." << std::endl;
    std::cerr << status.error_message() << std::endl;
    return -1;
  }

  sample.Run();
  std::cout << "Done!" << std::endl;

  return 0;
}


