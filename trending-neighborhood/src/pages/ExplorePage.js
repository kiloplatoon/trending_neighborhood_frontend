import React, { Component } from 'react';
import {Col, Row} from 'react-bootstrap';
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import ReactLoading from 'react-loading';
import NeighborhoodPreferencesForm from '../components/NeighborhoodPreferencesForm';
import Cities from '../config/Cities.json';
import backendAPI from "../api/backendAPI"
import ExploreCitySelectDropdown from '../components/ExploreCitySelectDropdown'
import NeighborhoodMap from "../components/NeighborhoodMap"
import ListView from '../components/ListView'
import ScoreBreakdown from '../components/ScoreBreakdown';
import { geolocated } from "react-geolocated";

class ExplorePage extends Component {
  state = {
    city: "Chicago",
    categories: {
      "Walkability": [1, 0],
      "Public Transit": [2, 0],
      "Restaurants and Bars": [1, 0],
      "Entertainment": [1, 0],
      "Shopping": [1, 0],
      "Parks": [1, 0],
      "Biking": [2, 0],
      "Errands": [2, 0],
      "Groceries": [2, 0],
      "Schools": [2, 0],
    },
    mapView: true,
    showExpandedCategories: false,
    scoreBreakdownNeighborhood: null,
    isLoading: false,
    isDefault: true,
    results: null //If testing w/o back end, use top5neighborhoods & import top5neighborhoods from '../mock_data/top5neighborhoods'
  }

  componentDidUpdate(prevState, prevProps) {
    // console.log('THIS IS WHAT IS UP')
    console.log("this.state.results: ", this.state.categories)
    // console.log(prevState)
    console.log("prevProps: ", prevProps.categories)
    // console.log("current Props: ", this.props)

    if (prevProps.categories !== this.state.categories){
      this.setState({results: this.state.results})
    }
  }

  componentDidMount() {
    // Checks to see what city was selected on the main landing page
    if (this.props.location.state && this.state.isDefault){
      this.setState({
        city: this.props.location.state,
        isLoading: true,
      })
      // console.log(this.state.city) //Check to see if this can get passed at this.state.city
      this.getDefaultResults(this.props.location.state)
    }
  }

  getDefaultResults = async (city) => { 
    let results = await backendAPI.getDefaultNeighborhoods(city)   
    // const results = top5neighborhoods //Comment out line when running API and uncomment the above lines
    // console.log(results)
    this.setState({
      results: results,
      isLoading: false,
      isDefault: false
    })
  }

  // After a user changes city preference on top button, this updates the this.state.city to the newly selected city
  handleCitySelect = event => {
    this.setState({
      city: Cities[event],
      isLoadiing: true,
      isDefault: true,
    })
    this.handleResetValues()
    this.getDefaultResults(this.state.city)
  }

  // Resets the user preference scores when going to a new city page
  handleResetValues = event => {
    this.setState({
      categories: {
        "Walkability": [1, 0],
        "Public Transit": [2, 0],
        "Restaurants and Bars": [1, 0],
        "Entertainment": [1, 0],
        "Shopping": [1, 0],
        "Parks": [1, 0],
        "Biking": [2, 0],
        "Errands": [2, 0],
        "Groceries": [2, 0],
        "Schools": [2, 0],
      },
    })
  }

  // Creates a neighborhoodObject to be used in the POST request after a user submits their preferences. 
  handleCategoriesSubmit = event => {
    event.preventDefault()

    let categoriesSelect = Object.entries(this.state.categories)
    let category = Object.entries(this.state.categories).map(obj => obj[0])
    let score = categoriesSelect.map(obj => obj[1][1])
    let submitCategories = {}
    for(let index = 0; index < category.length; index++) {
      submitCategories[`${category[index]}`] = score[index]
    }

    // console.log("OUTPUT", submitCategories)
    const neighborhoodObject = {
      city: this.state.city,
      categories: submitCategories
    }
    this.getResults(neighborhoodObject)
  }

  // API Call to the backend to get a new results object
  getResults = async neighborhoodObject => { 
    let results = await backendAPI.findNeighborhood(neighborhoodObject) 
    this.setState({
      results: results,
      isDefault: false,
    })
  }

  // Rounds the user score preferences 
  handleCategoryScore = event => {
    let cat = event.target.parentElement.id
    let val = parseInt(event.target.value)
    switch (true) {
      case (val>87): val=99;break;
      case (val>62): val=75; break;
      case (val>37): val=50; break;
      case (val>12): val=25; break;
      default: val=0
    }
    const { categories } = { ...this.state }
    const currentState = categories
    currentState[cat][1] = val
    // console.log(`Current State: ${currentState}`)
    this.setState({
      categories: currentState
    })
  }

  // Expands the category select when user selects "Complicate Things"
  handleExpandedCategories = () => {
    this.setState({
      showExpandedCategories: !this.state.showExpandedCategories,
    })
  }
  
  render() {
    if (this.state.isLoading === true) {
      return (
        <ReactLoading type={"bars"} color={"#ffffff"} height={'20%'} width={'20%'} />
      )
    }
    return (
      <div id="explore-page"> {/*style={{marginTop: "25px"}}*/}
        <Row>
          <Col style={{textAlign: "center"}}>
              {/* <ExploreCitySelectDropdown cities={ Cities } city={this.state.city}  handleCitySelect={ this.handleCitySelect }/> */}
          </Col>
        </Row>
        <div style={{position: 'absolute', top: '18%', right: '2%', zIndex: '3'}}>
           <NeighborhoodPreferencesForm city={this.state.city} categories={this.state.categories} handleExpandedCategories={this.handleExpandedCategories} showExpandedCategories={this.state.showExpandedCategories} handleCategoriesSubmit={this.handleCategoriesSubmit} handleCategoryScore={this.handleCategoryScore} handleResetValues={this.handleResetValues}/>
        </div>
        <Row id="map-list-layer" > {/*/ className="mx-3" style={{ height: '600', width: '100vw',}}*/}
          <div style={{position: 'absolute', top: '10%', left: '60px', zIndex: '2', }}>
             <BootstrapSwitchButton 
              style={"mt-4"}
              checked={this.state.mapView}
              width={100}
              onlabel='Map View'
              onstyle='light'
              offlabel='List View'
              offstyle='light'
              size='sm'
              onChange={(checked: boolean) => {
                this.setState({ mapView: checked })
              }}/>
          </div>
          <div id="map-list-components"> {/*style={{height: "960px", width: '70%', marginTop: '50px', overflowY: 'auto'}}*/}
            {this.state.mapView ? 
              <NeighborhoodMap id="neighborhood-map" city={ this.state.city } categories={this.state.categories} results={ this.state.results} isActive={ this.state.mapView } showExpandedCategories={this.state.showExpandedCategories}/> :
              <ListView  id="list-view" city={this.state.city} results={this.state.results.filter(neighborhood => neighborhood["Overall Score"] >= 100)}  userPreferences={this.state.categories} showExpandedCategories={this.state.showExpandedCategories}/> 
            }
          </div>       
        </Row>
      </div>
    );
  }
}

export default 
  geolocated({
    positionOptions: {
        enableHighAccuracy: false,
    },
    userDecisionTimeout: 5000,
  })(ExplorePage);