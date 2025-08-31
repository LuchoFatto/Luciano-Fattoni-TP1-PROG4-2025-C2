import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Background } from '../../components/background/background';

@Component({
    selector: 'app-login',
    imports: [Background, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.css',
})
export class Login { }
