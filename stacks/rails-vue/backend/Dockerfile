FROM ruby:3.3-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev libyaml-dev tzdata \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle install
COPY . .
ENV RAILS_ENV=development
EXPOSE 8080
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
