import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { TitleAdapterService } from './title-adapter.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(titleService: Title, titleAdapterService: TitleAdapterService) {
    titleAdapterService.title.subscribe((title) => {
      titleService.setTitle(`${title} - Kakeru`)
    })
  }
}
