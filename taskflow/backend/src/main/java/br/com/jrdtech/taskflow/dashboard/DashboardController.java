package br.com.jrdtech.taskflow.dashboard;

import br.com.jrdtech.taskflow.auth.UserPrincipal;
import br.com.jrdtech.taskflow.dashboard.DashboardService.Summary;
import br.com.jrdtech.taskflow.task.TaskDtos.TaskResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public Summary summary(@AuthenticationPrincipal UserPrincipal principal) {
        return service.summary(principal.getId());
    }

    @GetMapping("/recent-tasks")
    public List<TaskResponse> recentTasks(@AuthenticationPrincipal UserPrincipal principal) {
        return service.recentTasks(principal.getId());
    }
}
