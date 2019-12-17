import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { faPen, faHandPaper, faEraser } from '@fortawesome/free-solid-svg-icons'
import { Tool } from '../tool-bar/tool-bar.component'

const icons = {
  pen: faPen,
  hand: faHandPaper,
  eraser: faEraser
}

@Component({
  selector: 'app-tool-button',
  templateUrl: './tool-button.component.html',
  styleUrls: ['./tool-button.component.scss']
})
export class ToolButtonComponent implements OnInit {
  @Input() tool: Tool = 'pen'
  @Input() selectedTool: Tool = 'pen'
  @Output() selectedToolChange = new EventEmitter<Tool>()

  constructor() {}

  ngOnInit() {}

  get icon() {
    return icons[this.tool]
  }

  get isSelected() {
    return this.tool === this.selectedTool
  }

  handleClick() {
    if (this.selectedTool !== this.tool) {
      this.selectedToolChange.next(this.tool)
    }
  }
}
