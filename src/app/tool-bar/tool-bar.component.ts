import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'

export type Tool = 'pen' | 'hand' | 'eraser'

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.scss']
})
export class ToolBarComponent implements OnInit {
  @Input() title: string = ''
  @Output() titleChange = new EventEmitter<string>()

  @Input() tool: Tool = 'pen'
  @Output() toolChange = new EventEmitter<Tool>()

  constructor() {}

  ngOnInit() {}
}
