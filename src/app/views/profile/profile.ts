import { Component, inject } from '@angular/core';
import { Background } from '../../components/background/background';
import { ApiService } from '../../services/api-profile';

@Component({
    selector: 'app-profile',
    imports: [Background],
    templateUrl: './profile.html',
    styleUrl: './profile.css'
})
export class Profile {
    profileGitHub = inject(ApiService)

    ngOnInit() {
        this.profileGitHub.getProfile("LuchoFatto");
    }
}
