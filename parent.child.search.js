import { dlopen, FFIType, suffix, CString, ptr } from "bun:ffi";
import fs from 'fs';

class ParentChildSearch {
	constructor(filePath) {
		this.encoder = new TextEncoder();
		const path = `${import.meta.dir}/target/debug/libgeoip.${suffix}`;
		this.ffi = dlopen(path, {
			fuzzy_search: {
				args: [FFIType.pointer, FFIType.u32 ,FFIType.ptr],
				returns: FFIType.pointer
			}
		});
		const jsonData = JSON.parse(fs.readFileSync(filePath));
		if (!this.validateFileContent(jsonData)) {
			throw Error('File content are not according to format defied in config');
		}
		this.villagePreprocessedData = {
			levelBuffer: [],
			properties: []
		};
    this.subDistrictPreprocessedData = {
			levelBuffer: [],
			properties: []
		};;
    this.districtPreprocessedData = {
			levelBuffer: [],
			properties: []
		};;
    this.statePreProcessedData = {
			levelBuffer: [],
			properties: []
		};;
    
    jsonData.forEach(stateData => {
      stateData.districts.forEach(districtData => {
        districtData.subDistricts.forEach(subDistrictData => {
          subDistrictData.villages.forEach(village => {
            if (village !== null) {
							this.villagePreprocessedData.levelBuffer.push(this.encoder.encode(new String(village) + '\0'))
							this.villagePreprocessedData.properties.push({
								state: stateData.state,
								district: districtData.district,
								subDistrict: subDistrictData.subDistrict,
								village: village
							})
            }
          });
					this.subDistrictPreprocessedData.levelBuffer.push(this.encoder.encode(new String(subDistrictData.subDistrict) + '\0'));
					this.subDistrictPreprocessedData.properties.push({
						state: stateData.state,
						district: districtData.district,
						subDistrict: subDistrictData.subDistrict
					});
        });
				this.districtPreprocessedData.levelBuffer.push(this.encoder.encode(new String(districtData.district + '\0')));
				this.districtPreprocessedData.properties.push({
					state: stateData.state,
					district: districtData.district
				});
      });
      this.statePreProcessedData.levelBuffer.push(this.encoder.encode(new String(stateData.state + '\0')));
			this.statePreProcessedData.properties.push({
				state: stateData.state
			});
    });
		this.generatePointers(this.statePreProcessedData);
		console.log(this.statePreProcessedData);
		this.generatePointers(this.districtPreprocessedData);
		this.generatePointers(this.subDistrictPreprocessedData);
		this.generatePointers(this.villagePreprocessedData);
  }

	generatePointers(preProcessedData) {
		const levelPointers = [];
		for (const levelBuffer of preProcessedData.levelBuffer) {
			const levelPointer = ptr(levelBuffer);
			levelPointers.push(levelPointer)
		}
		const levelPointer64Array = new BigInt64Array(levelPointers.map(BigInt));
		preProcessedData['levelPointers'] = levelPointer64Array;
		preProcessedData['levelPointersLength'] = levelPointers.length;
		const levelPointerPtr = ptr(levelPointer64Array);
		preProcessedData['pointerToLevelPointers'] = levelPointerPtr;
	}

	validateFileContent(fileContent) {
		if (fileContent) return true;
		return false;
	}

	fuzzySearch(level, query, filters) {
		let queryPointer = ptr(this.encoder.encode(query + '\0'));
		console.log(queryPointer);
		const indexPointer = this.ffi.symbols.fuzzy_search(
			this.villagePreprocessedData.pointerToLevelPointers, 
			this.villagePreprocessedData.levelPointersLength, 
			queryPointer
		);
	}

	fuzzySearch(level, query, filters) {
		let queryPointer = ptr(this.encoder.encode(query + '\0'));
		console.log(queryPointer);
		const indexPointer = this.ffi.symbols.fuzzy_search(
			this.villagePreprocessedData.pointerToLevelPointers, 
			this.villagePreprocessedData.levelPointersLength, 
			queryPointer
		);
	}
}

const parentChildSearch = new ParentChildSearch(`${import.meta.dir}/PARSED_MASTER_LOCATION_NAMES.json`);

console.time('p')
parentChildSearch.fuzzySearch('', 'Ram', '')
console.timeEnd('p')