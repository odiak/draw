import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.scss']
})
export class ToolBarComponent implements OnInit {
  @Input() title: string
  @Output() titleChange = new EventEmitter<string>()

  @Output() save = new EventEmitter<undefined>()

  constructor() {}

  ngOnInit() {}
}
