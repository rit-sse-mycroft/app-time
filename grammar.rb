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
  					item "what's the"
  					item "what is the"
  				end
  				one_of do
  					item 'day'
  					item 'date'
  					item 'time'
  				end
  			end
  		end
  	end
  end
end
