/* Fleet.js
KC3改 Fleet Object

Contains summary information about a fleet and its 6 ships
{
	"api_member_id":18066975,
	"api_id":1,
	"api_name":"111",
	"api_name_id":"136558260",
	"api_mission":[ 0, 0, 0, 0 ],
	"api_flagship":"0",
	"api_ship":[ 76, -1, -1, -1, -1, -1 ]
}
*/
(function(){
	"use strict";
	
	window.KC3Fleet = function( data ){
		this.active = false;
		this.name = "";
		this.ships = [ -1, -1, -1, -1, -1, -1 ];
		this.mission = [ 0, 0, 0, 0 ];
	};
	
	KC3Fleet.prototype.update = function( data ){
		if(typeof data.api_member_id != "undefined"){
			this.active = true;
			this.name = data.api_name;
			this.ships = data.api_ship;
			this.mission = data.api_mission;
			if(data.api_id > 1){
				if(this.mission[0] > 0){
					KC3TimerManager.exped( data.api_id ).activate(
						this.mission[2],
						this.ship(0).masterId,
						this.mission[1]
					);
				}else{
					KC3TimerManager.exped( data.api_id ).deactivate();
				}
			}
		}
	};
	
	KC3Fleet.prototype.defineFormatted = function( data ){
		this.active = data.active;
		this.name = data.name;
		this.ships = data.ships;
		this.mission = data.mission;
		return this;
	};
	
	KC3Fleet.prototype.ship = function( slot ){
		return KC3ShipManager.get( this.ships[slot] );
	};
	
	KC3Fleet.prototype.countShips = function( slot ){
		return $.grep(this.ships, function(shipId){ return shipId>-1; }).length;
	};
	
	KC3Fleet.prototype.clearNonFlagShips = function(){
		this.ships[1] = -1;
		this.ships[2] = -1;
		this.ships[3] = -1;
		this.ships[4] = -1;
		this.ships[5] = -1;
	};
	
	KC3Fleet.prototype.totalLevel = function(){
		return this.ship(0).level
			+ this.ship(1).level
			+ this.ship(2).level
			+ this.ship(3).level
			+ this.ship(4).level
			+ this.ship(5).level;
	};
	
	KC3Fleet.prototype.countDrums = function(){
		return this.ship(0).countDrums()
			+ this.ship(1).countDrums()
			+ this.ship(2).countDrums()
			+ this.ship(3).countDrums()
			+ this.ship(4).countDrums()
			+ this.ship(5).countDrums();
	};
	
	KC3Fleet.prototype.countShipsWithDrums = function(){
		var shipsWithDrums = 0;
		shipsWithDrums += (this.ship(0).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(1).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(2).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(3).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(4).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(5).countDrums() > 0)?1:0;
		return shipsWithDrums;
	};
	
	KC3Fleet.prototype.averageLevel = function(){
		return this.totalLevel() / this.countShips();
	};
	
	KC3Fleet.prototype.fighterPower = function(){
		return this.ship(0).fighterPower()
			+ this.ship(1).fighterPower()
			+ this.ship(2).fighterPower()
			+ this.ship(3).fighterPower()
			+ this.ship(4).fighterPower()
			+ this.ship(5).fighterPower();
	};
	
	KC3Fleet.prototype.speed = function(){
		var FastFleet = true;
		if(this.ships[0] > -1){ FastFleet = FastFleet && this.ship(0).isFast(); }
		if(this.ships[1] > -1){ FastFleet = FastFleet && this.ship(1).isFast(); }
		if(this.ships[2] > -1){ FastFleet = FastFleet && this.ship(2).isFast(); }
		if(this.ships[3] > -1){ FastFleet = FastFleet && this.ship(3).isFast(); }
		if(this.ships[4] > -1){ FastFleet = FastFleet && this.ship(4).isFast(); }
		if(this.ships[5] > -1){ FastFleet = FastFleet && this.ship(5).isFast(); }
		return (FastFleet) ? KC3Meta.term("SpeedFast") : KC3Meta.term("SpeedSlow");
	};
	
	KC3Fleet.prototype.qualifyingExpeditions = function(){
		
	};
	
	KC3Fleet.prototype.compileStats = function(){
		
	};
	
	KC3Fleet.prototype.canCombineCarrier = function(){
		
	};
	
	KC3Fleet.prototype.canCombineSurface = function(){
		
	};
	
	KC3Fleet.prototype.supportPower = function(){
		
	};
	
	KC3Fleet.prototype.eLoS = function(){
		switch(ConfigManager.elosFormula){
			case 1: return this.eLos1(); break;
			case 2: return this.eLos2(); break;
			default: return this.eLos3(); break;
		}
	};
	
	/* LoS : Fitted
	Sum of all Ship LoS in the fleet WITH their equipment
	------------------------------------*/
	KC3Fleet.prototype.eLos1 = function(){
		return this.ship(0).ls[0]
			+ this.ship(1).ls[0]
			+ this.ship(2).ls[0]
			+ this.ship(3).ls[0]
			+ this.ship(4).ls[0]
			+ this.ship(5).ls[0];
	};
	
	/* LoS : "Old Formula"
	= Recon LoS×2 + Radar LoS + v(Fleet total LoS - Recon LoS - Radar LoS)
	------------------------------------*/
	KC3Fleet.prototype.eLos2 = function(){
		var PlaneLoS = 0;
		var RadarLoS = 0;
		
		function ConsiderShip(shipData){
			if(shipData.rosterId == 0) return false;
			if(shipData.items[0] > -1){ ConsiderEquipment( shipData.equipment(0) ); }
			if(shipData.items[1] > -1){ ConsiderEquipment( shipData.equipment(1) ); }
			if(shipData.items[2] > -1){ ConsiderEquipment( shipData.equipment(2) ); }
			if(shipData.items[3] > -1){ ConsiderEquipment( shipData.equipment(3) ); }
		}
		
		function ConsiderEquipment(itemData){
			if(itemData.itemId == 0) return false;
			if( itemData.master().api_type[1] == 7){ PlaneLoS += itemData.master().api_saku; }
			if( itemData.master().api_type[1] == 8){ RadarLoS += itemData.master().api_saku; }
		}
		
		ConsiderShip( this.ship(0) );
		ConsiderShip( this.ship(1) );
		ConsiderShip( this.ship(2) );
		ConsiderShip( this.ship(3) );
		ConsiderShip( this.ship(4) );
		ConsiderShip( this.ship(5) );
		
		return (PlaneLoS*2) + RadarLoS + Math.sqrt( this.eLos1() -  PlaneLoS - RadarLoS )
	};
	
	/* LoS : "New Formula"
	= Dive Bomber LoS x (1.04) + Torpedo Bomber LoS x (1.37) + Carrier-based Recon Plane LoS x (1.66) + Recon Seaplane LoS x (2.00) + Seaplane Bomber LoS x (1.78) + Small Radar LoS x (1.00) + Large Radar LoS x (0.99) + Searchlight LoS x (0.91) + v(base LoS of each ship) x (1.69) + (HQ Lv. rounded up to the next multiple of 5) x (-0.61)
	------------------------------------*/
	KC3Fleet.prototype.eLos3 = function(){
		var dive = 0, torp = 0, cbrp = 0, rspl = 0, splb = 0, smrd = 0, lgrd = 0, srch = 0;
		
		var self = this;
		function GetNakedLoS(){
			return Math.sqrt(self.ship(0).nakedLoS())
				+ Math.sqrt(self.ship(1).nakedLoS())
				+ Math.sqrt(self.ship(2).nakedLoS())
				+ Math.sqrt(self.ship(3).nakedLoS())
				+ Math.sqrt(self.ship(4).nakedLoS())
				+ Math.sqrt(self.ship(5).nakedLoS());
		}
		
		function ConsiderShip(shipData){
			if(shipData.rosterId == 0) return false;
			if(shipData.items[0] > -1){ ConsiderEquipment( shipData.equipment(0) ); }
			if(shipData.items[1] > -1){ ConsiderEquipment( shipData.equipment(1) ); }
			if(shipData.items[2] > -1){ ConsiderEquipment( shipData.equipment(2) ); }
			if(shipData.items[3] > -1){ ConsiderEquipment( shipData.equipment(3) ); }
		}
		
		function ConsiderEquipment(itemData){
			if(itemData.itemId == 0) return false;
			switch( itemData.master().api_type[2] ){
				case  7: dive += itemData.master().api_saku; break;
				case  8: torp += itemData.master().api_saku; break;
				case  9: cbrp += itemData.master().api_saku; break;
				case 10: rspl += itemData.master().api_saku; break;
				case 11: splb += itemData.master().api_saku; break;
				case 12: smrd += itemData.master().api_saku; break;
				case 13: lgrd += itemData.master().api_saku; break;
				case 29: srch += itemData.master().api_saku; break;
				default: break;
			}
		}
		
		ConsiderShip( this.ship(0) );
		ConsiderShip( this.ship(1) );
		ConsiderShip( this.ship(2) );
		ConsiderShip( this.ship(3) );
		ConsiderShip( this.ship(4) );
		ConsiderShip( this.ship(5) );
		
		var total = ( dive * 1.04 )
			+ ( torp * 1.37 )
			+ ( cbrp * 1.66 )
			+ ( rspl * 2.00 )
			+ ( splb * 1.78 )
			+ ( smrd * 1.00 )
			+ ( lgrd * 0.99 )
			+ ( srch * 0.91 )
			+ ( GetNakedLoS() * 1.69 )
			+ ( (Math.floor(( PlayerManager.hq.level + 4) / 5) * 5) * -0.61 );
		return total;
	};
	
	/* SORTIE JSON
	Used for recording sorties on indexedDB
	Generate fleet summary object without referential data (all masterId)
	Data must be recorded on the state of sortie execution, thus no reference
	------------------------------------*/
	KC3Fleet.prototype.sortieJson = function(){
		if(this.active){
			var ReturnObj = [];
			var self = this;
			$.each(this.ships, function(index, rosterId){
				if(rosterId > -1){
					ReturnObj.push({
						mst_id: self.ship(index).masterId,
						level: self.ship(index).level,
						kyouka: self.ship(index).mod,
						morale: self.ship(index).morale,
						equip: [
							self.ship(index).equipment(0).masterId,
							self.ship(index).equipment(1).masterId,
							self.ship(index).equipment(2).masterId,
							self.ship(index).equipment(3).masterId
						],
					});
				}
			});
			return ReturnObj;
		}else{
			return {};
		}
	};
	
})();