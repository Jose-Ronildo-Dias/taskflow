package br.com.jrdtech.taskflow.user;

import br.com.jrdtech.taskflow.auth.UserPrincipal;
import br.com.jrdtech.taskflow.user.UserDtos.ChangePasswordRequest;
import br.com.jrdtech.taskflow.user.UserDtos.DeleteAccountRequest;
import br.com.jrdtech.taskflow.user.UserDtos.UpdateProfileRequest;
import br.com.jrdtech.taskflow.user.UserDtos.UserResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
@Tag(name = "Usuários")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return UserResponse.from(userService.getById(principal.getId()));
    }

    @PatchMapping
    public UserResponse update(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestBody UpdateProfileRequest request) {
        return UserResponse.from(userService.updateName(principal.getId(), request.name()));
    }

    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestBody ChangePasswordRequest request,
                               HttpServletRequest http) {
        userService.changePassword(principal.getId(), request.currentPassword(), request.newPassword(),
                http.getSession().getId());
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,
                       @Valid @RequestBody DeleteAccountRequest request,
                       HttpServletRequest http) {
        userService.deleteAccount(principal.getId(), request.password());
        if (http.getSession(false) != null) {
            http.getSession(false).invalidate();
        }
    }
}
