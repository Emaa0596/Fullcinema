import { Component, OnInit, signal } from '@angular/core';
import {supabase} from "./supabase.client";
import { RouterOutlet, RouterLinkActive, RouterLink } from '@angular/router';
import { Header } from './shared/header/header';

@Component({
  imports: [RouterOutlet, Header],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {

}

/*export class App implements OnInit {
  //prueba coneccion con supabase
    async ngOnInit() {
    const { data, error } = await supabase.auth.getSession();
    console.log('Supabase data:', data);
    console.log('Supabase error:', error);
  }

}*/