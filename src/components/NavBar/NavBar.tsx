﻿import React, { Component as Cp } from "react";
import mainStyles from "../../css/main.module.css";
import { GearIcon } from "@radix-ui/react-icons";
import { Immutable } from "immer";
import DayTitle from "./DayTitle";
import { getDateAtWeekByWeekOffset } from "../../utils";
import { DateAtWeek } from "../../types/time";

type Props = Immutable<{
    incrementWeek :()=>void;
    decrementWeek :()=>void;
    /**在 `NavBar` 处进行范围检查。*/
    setWeek :(week :number)=>void;
    currentWeek :number;
    maxWeek :number;
    startWeekAtSunday :boolean;
    startWeek :DateAtWeek;
    showWeekend :boolean;
}>;
type State = Immutable<{
    editing :boolean;
    /**这个必须留，因为修改了state React才会更新视图，修改props会出现各种奇怪的问题
     * 
     * 但是我们一般不会用这个作为来源，仅用于绑定DOM和数据更新，**请使用props获取真正的、准确的数据***/
    currentWeek :number;
    time :Date;
}>;

/**@once*/
export default class NavBar extends Cp<Props, State>{

    constructor(props :Props){
        super(props);
        this.state = {
            editing: false,
            currentWeek: props.currentWeek,
            time: new Date()
        };
    }

    //#region 编辑跳转周数
        private ref = React.createRef<HTMLSpanElement>();
        private clickCB = ()=>{
            if(!this.state.editing) this.setState({editing: true}, ()=>{
                this.ref.current!.focus();
                getSelection()!.selectAllChildren(this.ref.current!);
                document.addEventListener("keypress", this.keyDoneCB);
            });
        }
        private keyDoneCB = (e :KeyboardEvent)=>{
            if(e.key === "Enter" && this.state.editing){
                e.preventDefault();
                this.reset();
            }
        }
        private blurCB = ()=>{
            if(this.state.editing) this.reset();
        }
        private reset(){
            const setState_Report = (week :number)=>{
                //这个仅用于触发React的视图更新，使得下一次props传入之前视图不会跳变
                this.setState({currentWeek: week});
                //好像必须我们自己干这活，React时不时会不干了
                this.ref.current!.innerText = week + "";
                this.props.setWeek(week);
            };
            this.setState({editing: false}, ()=>{
                document.removeEventListener("keypress", this.keyDoneCB);
                getSelection()!.empty();
                const newWeek = parseInt(this.ref.current!.innerText);
                //还原，这里React帮不了我们，我们自己干
                if(isNaN(newWeek)) this.ref.current!.innerText = this.state.currentWeek + "";
                else{
                    if(newWeek > this.props.maxWeek){
                        setState_Report(this.props.maxWeek);
                    }
                    else if(newWeek < 1) setState_Report(1);
                    else setState_Report(newWeek);
                }
            });
        }
    //#endregion
    
    //不能在这里做任何updateData的事情，因为data对象不在这里，只有根组件有访问完整data的权限，所以只能由根组件更新

    //#region 时钟
        timerID :number = -1;
        componentDidMount(){
            setInterval(()=>{
                this.setState({
                    time: new Date()
                });
            }, 1000);
        }
        componentWillUnmount(){
            if(this.timerID !== -1) clearInterval(this.timerID);
        }
    //#endregion

    render() :React.ReactNode{
        const buttonStyle :React.CSSProperties = {
            cursor: "pointer",
            padding: "0 2rem"
        }, theWeek = getDateAtWeekByWeekOffset(this.props.startWeek, this.props.currentWeek);
        return(<>
            <div className={mainStyles.noselect} style={{
                display: "flex",
                flexFlow: "row nowrap",
                justifyContent: "center",
                margin: ".5rem 0 1rem",
                fontSize: "1.2rem"
            }}>
                <div style={buttonStyle} title="后退一周" onClick={this.props.decrementWeek}>←</div>
                <div style={{
                    margin: "0 2rem"
                }}>
                    <div
                        style={{
                            cursor: this.state.editing ? "text" : "pointer",
                            padding: "0 2rem",
                        }}
                        title="输入周数"
                        onClick={this.clickCB}
                        onBlur={this.blurCB}
                    >第
                        <span
                            className={mainStyles.reselect}
                            ref={this.ref}
                            contentEditable={this.state.editing}
                            style={{
                                whiteSpace: "pre",
                                display: "inline-block",
                                textAlign: "center",
                                minWidth: "4rem"
                            }}
                        >{this.state.currentWeek}</span>
                    周</div>
                </div>
                <div style={buttonStyle} title="前进一周" onClick={this.props.incrementWeek}>→</div>
            </div>
            <div className={mainStyles.noselect} style={{
                display: "grid",
                grid: `auto-flow / repeat(${this.props.showWeekend ? 8 : 6}, 1fr)`
            }}>
                <div>
                    <div title="设置"><GearIcon width={"1.5rem"} height={"1.5rem"} style={{
                        cursor: "pointer"
                    }} /></div>
                    <div>
                        {`${this.state.time.getFullYear()}.${this.state.time.getMonth() + 1}.${this.state.time.getDate()} ${this.state.time.getHours()}:${(this.state.time.getMinutes() + "").padStart(2, "0")}`}
                    </div>
                </div>
                {
                    this.props.startWeekAtSunday ? <DayTitle weekDate={theWeek} dayIndex={7}/> : null
                }
                <DayTitle weekDate={theWeek} dayIndex={1}/>
                <DayTitle weekDate={theWeek} dayIndex={2} />
                <DayTitle weekDate={theWeek} dayIndex={3} />
                <DayTitle weekDate={theWeek} dayIndex={4} />
                <DayTitle weekDate={theWeek} dayIndex={5} />
                {
                    this.props.showWeekend ?
                        this.props.startWeekAtSunday ? 
                            <DayTitle weekDate={theWeek} dayIndex={6} />
                        : <>
                            <DayTitle weekDate={theWeek} dayIndex={6} />
                            <DayTitle weekDate={theWeek} dayIndex={7} />
                        </>
                    : null
                }
            </div>
        </>);
    }

}