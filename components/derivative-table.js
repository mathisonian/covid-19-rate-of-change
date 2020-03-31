const React = require('react');
const d3 = require('d3');


const CHART_WIDTH = 100;
const CHART_HEIGHT = 40;

class CustomComponent extends React.Component {

  constructor(props) {
    super(props);

    const xExtent = [d3.min(props.data, d => d3.min(d.data, dd => new Date(dd.date))), d3.max(props.data, d => d3.max(d.data, dd => new Date(dd.date)))]
    this.xScale = d3.scaleLinear().domain(xExtent).range([0, CHART_WIDTH]);

    this.state = {
      target: null,
      sortKey: 'cumulative',
      sortDirection: 'descending',
      showing: 'cases'
    }

    this.sortedData = props.data.sort((a, b) => {
      let av, bv;
      av = +a.data[a.data.length-1][this.getCumulativeKey()];
      bv = +b.data[b.data.length-1][this.getCumulativeKey()];
      return bv - av;
    });

  }

  getCumulativeKey(showingKey) {
    showingKey = showingKey || this.state.showing;
    if (showingKey === 'cases') {
      return 'cases';
    }
    return 'deaths'
  }
  getD1Key(showingKey) {
    showingKey = showingKey || this.state.showing;
    if (showingKey === 'cases') {
      return 'd1c';
    }
    return 'd1d'
  }
  getD2Key(showingKey) {
    showingKey = showingKey || this.state.showing;
    if (showingKey === 'cases') {
      return 'd2c';
    }
    return 'd2d'
  }

  renderSort(key) {
    if (this.state.sortKey !== key) {
      return null
    }

    if (this.state.sortDirection === 'ascending') {
      return '(asc.)'
    }
    return '(desc.)'
  }

  handleShowing(showingKey) {
    return () => {
      const keyMap = {
        state: 'state',
        cumulative: this.getCumulativeKey(showingKey),
        daily: this.getD1Key(showingKey),
        dailyroc: this.getD2Key(showingKey)
      }

      this.props.data.sort((a, b) => {

        let av, bv;
        if (this.state.sortKey === 'state') {
          av = a.name;
          bv = b.name;
          if (this.state.sortDirection === 'ascending') {
            return av.localeCompare(bv)
          }
          return bv.localeCompare(av)

        } else {
          av = +a.data[a.data.length-1][keyMap[this.state.sortKey]];
          bv = +b.data[b.data.length-1][keyMap[this.state.sortKey]];
        }

        if (this.state.sortDirection === 'ascending') {
          return av - bv
        }
        return bv - av;

      })

      this.sortedData = this.props.data;
      this.setState({
        showing: showingKey
      })

    }
  }

  handleSort(sortKey) {
    return () => {
      const keyMap = {
        state: 'state',
        cumulative: this.getCumulativeKey(),
        daily: this.getD1Key(),
        dailyroc: this.getD2Key()
      }

      if (this.state.sortKey === sortKey) {
        const direction = this.state.sortDirection === 'ascending' ? 'descending' : 'ascending';
        this.props.data.sort((a, b) => {

          let av, bv;
          if (sortKey === 'state') {
            av = a.name;
            bv = b.name;
            if (direction === 'ascending') {
              return av.localeCompare(bv)
            }
            return bv.localeCompare(av)

          } else {
            av = +a.data[a.data.length-1][keyMap[sortKey]];
            bv = +b.data[b.data.length-1][keyMap[sortKey]];
          }

          if (direction === 'ascending') {
            return av - bv
          }
          return bv - av;

        })
        this.sortedData = this.props.data;
        this.setState({
          sortDirection: direction
        })
      } else {
        const direction = 'descending';
        this.props.data.sort((a, b) => {
          let av, bv;
          if (sortKey === 'state') {
            av = a.name;
            bv = b.name;
            if (direction === 'ascending') {
              return av.localeCompare(bv)
            }
            return bv.localeCompare(av)

          } else {
            av = +a.data[a.data.length-1][keyMap[sortKey]];
            bv = +b.data[b.data.length-1][keyMap[sortKey]];
          }
          if (direction === 'ascending') {
            return av - bv
          }
          return bv - av;
        })
        this.sortedData = this.props.data;

        this.setState({
          sortKey: sortKey,
          sortDirection: direction
        })
      }
    }
  }

  handleHover(e) {
    const x = this.xScale.invert(e.nativeEvent.offsetX)
    if (x) {
      this.setState({target: x});
    }
  }

  handleMouseOut(e) {
    console.log('MOUSE OUT')
    this.setState({ target: null })
  }

  renderCumulative(data) {

    const _key = this.getCumulativeKey();
    const filteredData = data.filter(d => {
      return d[_key] !== ''
    });


    const scaleY = d3.scaleLinear().domain(d3.extent(filteredData, d => +d[_key])).range([CHART_HEIGHT/2, 0]);


    let minDistance = Number.POSITIVE_INFINITY;
    let targetVal;
    const line = d3.line().x((d) => {
      const _date = new Date(d.date);
      if (this.state.target) {
        if (Math.abs(_date - this.state.target) < minDistance) {
          targetVal = +d[_key];
          minDistance = Math.abs(_date - this.state.target);
        }
      }
      return this.xScale(_date);
    })
    .y((d) => { return scaleY(+d[_key]); });


    const _this = this;
    return (
      <div>
        <svg width={CHART_WIDTH} height={CHART_HEIGHT/2} onMouseMove={this.handleHover.bind(this)} onMouseLeave={this.handleMouseOut.bind(this)}>
          <g style={{pointerEvents: 'none'}}>
            <line x1={0} x2={CHART_WIDTH} y1={CHART_HEIGHT/2} y2={CHART_HEIGHT/2} stroke="#999" strokeWidth={1} />
            <path d={line(filteredData)} fill="none" stroke="#000" strokeWidth="1" />
            {
              this.state.target ?
              <line x1={this.xScale(this.state.target)} x2={this.xScale(this.state.target)} y1={0} y2={CHART_HEIGHT/2} strokeDasharray={'1.5, 1.5'} stroke={'#999'} strokeWidth="0.5" />
              : null
            }
          </g>
        </svg>
        <span style={{overflow: 'visible', position: 'absolute', paddingLeft: 5, paddingTop: 10}}>
          {targetVal}
        </span>
      </div>
    )

  }
  renderD1(data) {

    const _key = this.getD1Key();
    const filteredData = data.filter(d => {
      return d[_key] !== ''
    });


    const ext = d3.extent(filteredData, d => +d[_key]);
    const mx = Math.max(Math.abs(ext[0]), Math.abs(ext[1]));
    const scaleY = d3.scaleLinear().domain([-mx, mx]).range([CHART_HEIGHT, 0]);


    let minDistance = Number.POSITIVE_INFINITY;
    let targetVal;
    const line = d3.line().x((d) => {
      const _date = new Date(d.date);
      if (this.state.target) {
        if (Math.abs(_date - this.state.target) < minDistance) {
          targetVal = +d[_key];
          minDistance = Math.abs(_date - this.state.target);
        }
      }
      return this.xScale(new Date(d.date));
    })
    .y((d) => {
      return scaleY(+d[_key]);
    });

    const _this = this;
    return (
      <div>
        <svg width={CHART_WIDTH} height={CHART_HEIGHT} onMouseMove={this.handleHover.bind(this)} onMouseLeave={this.handleMouseOut.bind(this)}>
          <g style={{pointerEvents: 'none'}}>
            <line x1={0} x2={CHART_WIDTH} y1={CHART_HEIGHT/2} y2={CHART_HEIGHT/2} stroke="#999" strokeWidth={0.5} />
            <path d={line(filteredData)} fill="none" stroke="url(#line-gradient)" strokeWidth="1" />
            {
              this.state.target ?
              <line x1={this.xScale(this.state.target)} x2={this.xScale(this.state.target)} y1={0} y2={CHART_HEIGHT} strokeDasharray={'1.5, 1.5'} stroke={'#999'} strokeWidth="0.5" />
              : null
            }
          </g>
        </svg>
        <span style={{overflow: 'visible', position: 'absolute', paddingLeft: 5, paddingTop: 10}}>
          {targetVal}
        </span>
      </div>
    )
  }
  renderD2(data) {

    const _key = this.getD2Key();
    const filteredData = data.filter(d => {
      return d[_key] !== ''
    });

    const ext = d3.extent(filteredData, d => +d[_key]);
    const mx = Math.max(Math.abs(ext[0]), Math.abs(ext[1]));
    const scaleY = d3.scaleLinear().domain([-mx, mx]).range([CHART_HEIGHT, 0]);

    let minDistance = Number.POSITIVE_INFINITY;
    let targetVal;
    const line = d3.line().x((d) => {
      const _date = new Date(d.date);
      if (this.state.target) {
        if (Math.abs(_date - this.state.target) < minDistance) {
          targetVal = +d[_key];
          minDistance = Math.abs(_date - this.state.target);
        }
      }
      return this.xScale(new Date(d.date));
    })
    .y((d) => { return scaleY(+d[_key]); });


    const _this = this;
    return (
      <div>
        <svg width={CHART_WIDTH} height={CHART_HEIGHT} onMouseMove={this.handleHover.bind(this)} onMouseLeave={this.handleMouseOut.bind(this)}>
          <g style={{pointerEvents: 'none'}}>
            <line x1={0} x2={CHART_WIDTH} y1={CHART_HEIGHT/2} y2={CHART_HEIGHT/2} stroke="#999" strokeWidth={0.5} />
            <path d={line(filteredData)} fill="none" stroke="url(#line-gradient)" strokeWidth="1" />
            {
              this.state.target ?
              <line x1={this.xScale(this.state.target)} x2={this.xScale(this.state.target)} y1={0} y2={CHART_HEIGHT} strokeDasharray={'1.5, 1.5'} stroke={'#999'} strokeWidth="0.5" />
              : null
            }
          </g>
        </svg>
        <span style={{overflow: 'visible', position: 'absolute', paddingLeft: 5, paddingTop: 10}}>
          {targetVal}
        </span>
      </div>
    )
  }

  renderState(data) {
    return (
      <div key={data.name} className="row" style={{display: 'flex', flexDirection: 'row', width: '100%'}} >
        <div style={{minWidth: 100, flexBasis: 'auto', maxWidth: 100, flexGrow: 1}}>
          {data.name}
        </div>
        <div style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-around'}}>
          <div>{this.renderCumulative(data.data)}</div>
          <div>{this.renderD1(data.data)}</div>
          <div>{this.renderD2(data.data)}</div>
        </div>
      </div>
    )
  }


  render() {
    const { hasError, idyll, updateProps, ...props } = this.props;

    return (
      <div className="derivative-table" {...props}>
        <div style={{textAlign: 'center', width: '100%', margin: '0 auto 6em auto'}}>
          Show: <span style={{cursor: 'pointer', textDecoration: this.state.showing === 'cases' ? 'underline': 'none'}} onClick={this.handleShowing('cases')}>Cases</span> / <span style={{cursor: 'pointer', textDecoration: this.state.showing === 'deaths' ? 'underline': 'none'}} onClick={this.handleShowing('deaths')}>Deaths</span>
        </div>
        <svg style={{visibility: 'hidden', position: 'absolute'}} height={CHART_HEIGHT} width={CHART_WIDTH}>
          <defs>
            <linearGradient id="line-gradient" x1="0%" x2="0%" y1="0" y2="100%" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C13940" />
              <stop offset="49%" stopColor="#C13940" />
              <stop offset="51%" stopColor="#7BB9D9" />
              <stop offset="100%" stopColor="#7BB9D9" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{display: 'flex', flexDirection: 'row', width: '100%', marginBottom: '4em'}}>
          <div style={{width: 100, textAlign: 'center'}} onClick={this.handleSort('state')} className="sortable">
            State {this.renderSort('state')}
          </div>
          <div style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-around', textAlign: 'center'}}>
            <div style={{width: CHART_WIDTH}} onClick={this.handleSort('cumulative')} className="sortable">Cumulative {this.renderSort('cumulative')}</div>
            <div style={{width: CHART_WIDTH}} onClick={this.handleSort('daily')} className="sortable">Daily Increase {this.renderSort('daily')}</div>
            <div style={{width: CHART_WIDTH}} onClick={this.handleSort('dailyroc')} className="sortable">Daily Increase Diff. {this.renderSort('dailyroc')}</div>
          </div>
        </div>
        {
          this.sortedData.map((state) =>{
            return this.renderState(state)
          })
        }
        {
          this.state.target ?
          <div style={{position: 'fixed', bottom: 0, right: 0, fontSize: 12 }}>
            {(new Date(this.state.target)).toLocaleDateString()}
          </div>
          : null
        }
      </div>
    );
  }
}


module.exports = CustomComponent;
