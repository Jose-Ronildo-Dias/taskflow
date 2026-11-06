package br.com.jrdtech.taskflow.task;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    @Override
    @EntityGraph(attributePaths = "category")
    Page<Task> findAll(Specification<Task> spec, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Optional<Task> findByIdAndUserId(UUID id, UUID userId);

    long countByCategoryIdAndUserId(UUID categoryId, UUID userId);

    @Query("select t.category.id, count(t) from Task t "
            + "where t.userId = :userId and t.category is not null group by t.category.id")
    List<Object[]> countTasksByCategory(@Param("userId") UUID userId);

    long countByUserId(UUID userId);

    long countByUserIdAndStatus(UUID userId, TaskStatus status);

    long countByUserIdAndStatusNotAndDueAtBefore(UUID userId, TaskStatus status, Instant before);

    long countByUserIdAndStatusNotAndDueAtBetween(UUID userId, TaskStatus status, Instant from, Instant to);

    @EntityGraph(attributePaths = "category")
    List<Task> findTop5ByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("select t from Task t left join fetch t.category "
            + "where t.userId = :userId and t.status <> :done and t.priority in :priorities "
            + "order by case when t.dueAt is null then 1 else 0 end, t.dueAt asc, t.createdAt desc")
    List<Task> findPendingByPriorities(@Param("userId") UUID userId, @Param("done") TaskStatus done,
                                       @Param("priorities") Collection<TaskPriority> priorities, Pageable pageable);

    @Query("select t from Task t left join fetch t.category "
            + "where t.userId = :userId and t.status <> :done and t.dueAt is not null "
            + "order by t.dueAt asc, t.createdAt desc")
    List<Task> findPendingWithDeadline(@Param("userId") UUID userId, @Param("done") TaskStatus done,
                                       Pageable pageable);
}
