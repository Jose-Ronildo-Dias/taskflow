package br.com.jrdtech.taskflow.task;

import br.com.jrdtech.taskflow.task.TaskDtos.TaskFilter;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

public final class TaskSpecifications {

    public enum SortField {
        CREATED_AT, DUE_AT, PRIORITY, TITLE
    }

    private TaskSpecifications() {
    }

    /** Toda consulta de tarefas parte do proprietário: o filtro por usuário nunca é opcional. */
    public static Specification<Task> search(UUID userId, TaskFilter filter, Instant now, SortField sortField,
                                             boolean ascending) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("userId"), userId));

            if (filter.q() != null && !filter.q().isBlank()) {
                String pattern = "%" + escapeLike(filter.q().trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.<String>get("title")), pattern, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("description"), "")), pattern, '\\')));
            }
            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }
            if (filter.priority() != null) {
                predicates.add(cb.equal(root.get("priority"), filter.priority()));
            }
            if (filter.categoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), filter.categoryId()));
            } else if (filter.withoutCategory()) {
                predicates.add(cb.isNull(root.get("category")));
            }
            if (filter.overdue()) {
                predicates.add(cb.notEqual(root.get("status"), TaskStatus.DONE));
                predicates.add(cb.isNotNull(root.get("dueAt")));
                predicates.add(cb.lessThan(root.<Instant>get("dueAt"), now));
            }
            if (filter.noDueDate()) {
                predicates.add(cb.isNull(root.get("dueAt")));
            }
            if (filter.dueFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<Instant>get("dueAt"), filter.dueFrom()));
            }
            if (filter.dueTo() != null) {
                predicates.add(cb.lessThan(root.<Instant>get("dueAt"), filter.dueTo()));
            }

            if (!isCountQuery(query)) {
                query.orderBy(orderBy(root, cb, sortField, ascending));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static boolean isCountQuery(CriteriaQuery<?> query) {
        Class<?> type = query.getResultType();
        return type == Long.class || type == long.class;
    }

    private static List<Order> orderBy(Root<Task> root, jakarta.persistence.criteria.CriteriaBuilder cb,
                                       SortField sortField, boolean ascending) {
        List<Order> orders = new ArrayList<>();
        switch (sortField) {
            case DUE_AT -> {
                Expression<Integer> nullsLast = cb.<Integer>selectCase()
                        .when(cb.isNull(root.get("dueAt")), 1)
                        .otherwise(0);
                orders.add(cb.asc(nullsLast));
                orders.add(direction(cb, root.get("dueAt"), ascending));
            }
            case PRIORITY -> {
                Expression<Integer> rank = cb.<Integer>selectCase()
                        .when(cb.equal(root.get("priority"), TaskPriority.URGENT), 4)
                        .when(cb.equal(root.get("priority"), TaskPriority.HIGH), 3)
                        .when(cb.equal(root.get("priority"), TaskPriority.MEDIUM), 2)
                        .otherwise(1);
                orders.add(direction(cb, rank, ascending));
            }
            case TITLE -> orders.add(direction(cb, cb.lower(root.<String>get("title")), ascending));
            case CREATED_AT -> orders.add(direction(cb, root.get("createdAt"), ascending));
        }
        orders.add(cb.desc(root.get("createdAt")));
        orders.add(cb.asc(root.get("id")));
        return orders;
    }

    private static Order direction(jakarta.persistence.criteria.CriteriaBuilder cb, Expression<?> expression,
                                   boolean ascending) {
        return ascending ? cb.asc(expression) : cb.desc(expression);
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
