docker compose -f .\elk\docker-compose.yml down
docker compose down
docker compose -f .\docker-compose.kafka.yml down
docker compose -f .\docker-compose.mongo.yml down


docker compose -f .\docker-compose.mongo.yml up -d
docker compose -f .\docker-compose.kafka.yml up -d
docker compose up -d
docker compose -f .\elk\docker-compose.yml up -d
