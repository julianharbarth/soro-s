#pragma once

#include "soro/infrastructure/infrastructure.h"
#include "soro/timetable/timetable.h"
#include "soro/utls/unixtime.h"

namespace soro::simulation {

struct ordering_node {
  using id = uint32_t;
  static constexpr id INVALID = std::numeric_limits<id>::max();

  id id_{INVALID};
  infra::interlocking_route::id ir_id_{infra::interlocking_route::INVALID};
  tt::train::id train_id_{tt::train::INVALID};

  std::vector<id> in_;
  std::vector<id> out_;
};

struct ordering_graph {
  ordering_graph(infra::infrastructure const& infra, tt::timetable const& tt);
  ordering_graph(infra::infrastructure const& infra, tt::timetable const& tt,
                 tt::interval const& interval);

  std::span<const ordering_node> trip_nodes(tt::train::trip const trip) const;

  std::vector<ordering_node> nodes_;
  std::map<tt::train::trip, std::pair<ordering_node::id, ordering_node::id>>
      trip_to_nodes_;
};

}  // namespace soro::simulation
