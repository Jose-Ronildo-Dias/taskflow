package br.com.jrdtech.taskflow.category;

import br.com.jrdtech.taskflow.auth.UserPrincipal;
import br.com.jrdtech.taskflow.category.CategoryDtos.CategoryRequest;
import br.com.jrdtech.taskflow.category.CategoryDtos.CategoryResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categorias")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<CategoryResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return service.list(principal.getId());
    }

    @GetMapping("/{id}")
    public CategoryResponse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return service.get(principal.getId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                   @Valid @RequestBody CategoryRequest request) {
        return service.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public CategoryResponse update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                   @Valid @RequestBody CategoryRequest request) {
        return service.update(principal.getId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        service.delete(principal.getId(), id);
    }
}
