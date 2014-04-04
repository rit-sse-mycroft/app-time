require 'srgs'

module TimeGrammar
  include Srgs::DSL

  extend self

  grammar 'time' do
  	public_rule 'time' do
  		item 'Mycroft'
  		one_of do
  			item 'do you have the time'
  			item 'what time is it'
  			item 'what day is it'
  			item do
  				one_of do
  					item "what's"
  					item "what is"
  				end
  				one_of do
  					item 'the day'
  					item 'the date'
  					item 'the time'
            item 'today'
  				end
  			end
  		end
  	end
  end
end
