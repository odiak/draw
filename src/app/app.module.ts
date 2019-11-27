import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { DrawingScreenComponent } from './drawing-screen/drawing-screen.component'
import { ToolBarComponent } from './tool-bar/tool-bar.component'
import { HttpClientModule } from '@angular/common/http'

@NgModule({
  declarations: [AppComponent, DrawingScreenComponent, ToolBarComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
