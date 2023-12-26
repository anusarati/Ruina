import { LookupResult, Localization } from "@ghoulean/ruina-common";
import { default as __LOWER_LOOKUP_RESULTS } from "../data/lowerLookupResults.json";
import { autocomplete, MeasuredPrefix, unindexed_autocomplete } from "may-you-find";
import * as fastestLevenshtein from "fastest-levenshtein";

import { DataAccessor, QueryToLookupResult } from "./data_accessor";

const LOWER_LOOKUP_RESULTS: QueryToLookupResult =
    __LOWER_LOOKUP_RESULTS as QueryToLookupResult;

// duplicated const definition (export or move from data_accessor.ts?)
const FUZZY_MATCHING_DISTANCE = 2;

// Derived class of DataAccessor that uses an index for autocompletion
export class IndexedDataAccessor extends DataAccessor {
    // Returns the top `requested` number of LookupResults with the best prefix edit distance from `query`
    // Attempts to return strings in the given `locale`
    public autocomplete_top(query: string, requested: number, locale: Localization): LookupResult[] {
        let lowerQuery = query.toLowerCase();
        let measures: MeasuredPrefix[] = autocomplete(lowerQuery, requested);
        // autocomplete should be guaranteed to return the same number of results
        // as `requested`, if requested is positive and there are enough strings in the dataset
        // (not checking the latter to avoid importing lowerAutocomplete.json)
        if (measures.length != requested
            && requested >= 0) {
            throw new Error("No autocomplete results despite expecting some");
        }

        let results: LookupResult[] = [];
        for (let measure of measures) {
            let found = measure.string;
            let lookupResults: LookupResult[] | undefined = LOWER_LOOKUP_RESULTS[found];
            // this should mean an mismatch in the data files
            if (!lookupResults) {
                throw new Error("Lowercase autocomplete data does not correspond to "
                    + "a lowercase lookup result");
            }
            let localizedResults = lookupResults.filter(data => data.locale == locale);
            // strangely, using if (localizedResults) {...} instead seems to cause a bug
            if (localizedResults.length > 0) {
                lookupResults = localizedResults;
            }

            // Use the original query to disambiguate between case
            results.push(this.bestResult(lookupResults, query));
            measure.free();
        }
        return results;
    }
    // Returns the LookupResult for the given `query` and `preferredLocale`
    // 
    // Falls back to the best LookupResult from autocomplete_top()
    // if the edit distance is at most `FUZZY_MATCHING_DISTANCE`
    public lookup(query: string, preferredLocale: Localization): LookupResult {
        // mimic base lookup
        let lookupResults: LookupResult[] | undefined = LOWER_LOOKUP_RESULTS[query.toLowerCase()];
        if (!lookupResults) {
            lookupResults = this.autocomplete_top(query, 1, preferredLocale);
            let best: string = lookupResults[0].query;
            if (fastestLevenshtein.distance(best, query) > FUZZY_MATCHING_DISTANCE) {
                throw new Error(`Couldn't identify query result for ${query}.`);
            }
        }
        for (const lookupResult of lookupResults) {
            if (lookupResult.locale == preferredLocale) {
                return lookupResult;
            }
        }
        return lookupResults[0];
    }
    // Returns the LookupResult whose query has the best prefix edit distance from the given `query`
    private bestResult(lookupResults: LookupResult[], query: string): LookupResult {
        let variations: string[] = lookupResults.map(lookupResult => lookupResult.query);
        let measures: MeasuredPrefix[] = unindexed_autocomplete(query, 1, variations);
        let best: MeasuredPrefix = measures[0];
        let bestResults = lookupResults.filter(data => data.query == best.string);
        best.free();
        return bestResults[0];
    }
}