package br.com.jrdtech.taskflow.category;

import br.com.jrdtech.taskflow.category.CategoryDtos.CategoryRequest;
import br.com.jrdtech.taskflow.category.CategoryDtos.CategoryResponse;
import br.com.jrdtech.taskflow.common.Exceptions.ConflictException;
import br.com.jrdtech.taskflow.common.Exceptions.NotFoundException;
import br.com.jrdtech.taskflow.task.TaskRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private static final String DUPLICATE_MESSAGE = "Você já possui uma categoria com este nome.";

    private final CategoryRepository categories;
    private final TaskRepository tasks;

    public CategoryService(CategoryRepository categories, TaskRepository tasks) {
        this.categories = categories;
        this.tasks = tasks;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(UUID userId) {
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : tasks.countTasksByCategory(userId)) {
            counts.put((UUID) row[0], (Long) row[1]);
        }
        return categories.findAllByUser(userId).stream()
                .map(c -> CategoryResponse.from(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse get(UUID userId, UUID id) {
        Category category = find(userId, id);
        return CategoryResponse.from(category, tasks.countByCategoryIdAndUserId(id, userId));
    }

    @Transactional
    public CategoryResponse create(UUID userId, CategoryRequest request) {
        String name = request.name().trim();
        if (categories.existsByUserIdAndNameIgnoreCase(userId, name)) {
            throw new ConflictException(DUPLICATE_MESSAGE);
        }
        Category saved = categories.saveAndFlush(new Category(userId, name, request.color()));
        return CategoryResponse.from(saved, 0);
    }

    @Transactional
    public CategoryResponse update(UUID userId, UUID id, CategoryRequest request) {
        Category category = find(userId, id);
        String name = request.name().trim();
        if (categories.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, name, id)) {
            throw new ConflictException(DUPLICATE_MESSAGE);
        }
        category.setName(name);
        category.setColor(request.color());
        categories.flush();
        return CategoryResponse.from(category, tasks.countByCategoryIdAndUserId(id, userId));
    }

    /** As tarefas associadas são mantidas e ficam sem categoria (regra aplicada pelo banco: ON DELETE SET NULL). */
    @Transactional
    public void delete(UUID userId, UUID id) {
        Category category = find(userId, id);
        categories.delete(category);
        categories.flush();
    }

    private Category find(UUID userId, UUID id) {
        return categories.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Categoria não encontrada."));
    }
}
