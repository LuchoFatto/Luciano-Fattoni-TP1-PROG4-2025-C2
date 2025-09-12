import { Component } from '@angular/core';
import { Background } from '../../components/background/background';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-home',
    imports: [Background, RouterLink],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class Home {

}
